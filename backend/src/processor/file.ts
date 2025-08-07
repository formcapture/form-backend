import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';

import mime from 'mime-types';
import { Logger } from 'winston';

import { setupLogger } from '../logger';
import { DataItem } from '../types/data';
import { FormConfigInternal } from '../types/formConfigInternal';
import { JoinTable } from '../types/joinTable';
import { Opts } from '../types/opts';
import { GenericRequestError, InternalServerError } from '../errors/GenericRequestError';

export interface FileProcessorOpts {
  opts: Opts;
  formId: string;
}

export class FileProcessor {

  #opts: Opts;
  #formId: string;
  #logger: Logger;

  constructor(opts: FileProcessorOpts) {
    this.#opts = opts.opts;
    this.#formId = opts.formId;
    this.#logger = setupLogger({ label: 'fileProcessor' });
  }

  validateFileFields(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    this.#logger.debug('Validating file fields');
    const fileKeys = this.#getFileKeysFromItem(item, formConfig);
    const allFilesValid = fileKeys.every(key => {
      if (this.#isBase64String(item[key])) {
        return this.#isValidMimeType(key, item[key], formConfig)
          && this.#isWithinSizeLimit(key, item[key], formConfig);
      }
      return this.#isFilePathString(item[key], formConfig, key, item)
        || item[key] === null
        || item[key] === undefined
        || item[key] === '';
    });
    this.#logger.debug('Files are valid:', allFilesValid);
    return allFilesValid;
  }

  async createFiles(
    {
      item,
      keysAndFiles,
      formConfig,
      itemId,
      configKey
    }: {
      item: DataItem;
      keysAndFiles: Record<string, string>;
      formConfig: FormConfigInternal | JoinTable;
      itemId?: string;
      configKey?: string;
    }
  ) {
    const itemClone = structuredClone(item);
    if (itemId !== null && itemId !== undefined) {
      itemClone[formConfig.dataSource.idColumn] = itemId;
    }
    for (const key in keysAndFiles) {
      if (key in keysAndFiles) {
        await this.#removeOldFiles(itemClone[formConfig.dataSource.idColumn], key, configKey);
        itemClone[key] = await this.#createFile(itemClone, key, keysAndFiles[key], formConfig, configKey);
      }
    }
    return Object.keys(item).reduce((acc, key) => ({ ...acc, [key]: itemClone[key] }), {});
  }

  async deleteFiles(
    itemId: string,
    formConfig: FormConfigInternal | JoinTable,
    fileKeys?: string[],
    configKey?: string
  ) {
    let keysWithFiles = fileKeys;
    if (!keysWithFiles) {
      keysWithFiles = this.#getFileKeysFromConfig(formConfig);
    }
    for (const key of keysWithFiles) {
      await this.#removeOldFiles(itemId, key, configKey);
    }
  }

  getFilesFromItem(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const fileKeysWithData = this.#getFileKeysFromItem(item, formConfig)
      .filter((key: any) => item[key] && this.#isBase64String(item[key]));

    return fileKeysWithData.reduce((acc, key) => {
      return {
        ...acc,
        [key]: item[key]
      };
    }, {});
  }

  getEmptyFileFields(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const fileKeys = this.#getFileKeysFromConfig(formConfig);

    return fileKeys.filter(key => {
      return item[key] === null || item[key] === undefined || item[key] === '';
    });
  }

  getItemWithoutFiles(item: DataItem, keys: string[]) {
    return Object.keys(item).reduce((acc, itemKey) => {
      if (keys.includes(itemKey)) {
        return {...acc};
      }
      return {
        ...acc,
        [itemKey]: item[itemKey]
      };
    }, {});
  }

  async fileExists(fileIdentifier: string) {
    try {
      const targetDir =
        `${this.#opts.FILE_UPLOAD_DIR}${this.#opts.FILE_UPLOAD_DIR.endsWith('/') ? '' : '/'}${this.#formId}`;
      const files = await readdir(targetDir, {
        encoding: 'utf-8',
        recursive: true
      });
      return files.includes(fileIdentifier);
    } catch {
      return false;
    }
  }

  getFilePath(fileIdentifier: string) {
    return `${this.#formId}/${fileIdentifier}`;
  }

  #getFileKeysFromConfig(formConfig: FormConfigInternal | JoinTable) {
    return Object.keys(formConfig.properties).filter(key => {
      return formConfig.properties[key].type === 'string'
        && formConfig.properties[key].media
        && formConfig.properties[key].media.binaryEncoding === 'base64';
    });
  }

  #getFileKeysFromItem(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    return Object.keys(item).filter(key => {
      if (!formConfig.properties[key]) {
        return false;
      }
      return formConfig.properties[key].type === 'string'
        && formConfig.properties[key].media
        && formConfig.properties[key].media.binaryEncoding === 'base64';
    });
  }

  #isBase64String(str: string) {
    return /^data:(\w+\/[-+.\w]+);base64,/.test(str);
  }

  #isValidMimeType(key: string, base64String: string, formConfig: FormConfigInternal | JoinTable) {
    const [header] = base64String.split(';base64,');
    const mimeType = header.split(':')[1] ?? 'text/plain';
    const allowedMimeTypes = formConfig.properties[key].options?.mime_type;
    if (!allowedMimeTypes) {
      return true;
    }
    if (Array.isArray(allowedMimeTypes)) {
      return allowedMimeTypes.includes(mimeType);
    }
    return allowedMimeTypes === mimeType;
  }

  #isWithinSizeLimit(key: string, base64String: string, formConfig: FormConfigInternal | JoinTable) {
    const base64File = base64String.split(';base64,').pop();
    if (!base64File) {
      return false;
    }
    const fileSize = Buffer.byteLength(base64File, 'base64');
    const maxFileSize = formConfig.properties[key].options?.max_upload_size;
    // no limit if max_upload_size is 0
    if (!maxFileSize) {
      return true;
    }
    return fileSize <= maxFileSize;
  }

  #isFilePathString(str: string, formConfig: FormConfigInternal | JoinTable, key: string, item: DataItem) {
    const regexp = new RegExp(`^${this.#formId}/(.+/)*${key}_${item[formConfig.dataSource.idColumn]}(\\..*)?`);
    return regexp.test(str);
  }

  #getFileExtension(mimeType: string) {
    const extension = mime.extension(mimeType);
    if (!extension) {
      return '';
    }
    return extension;
  }

  async #createDir(path: string) {
    try {
      // will throw error, if directory does not exist
      await stat(path);
    } catch {
      await mkdir(path, { recursive: true });
    }
  }

  #createFileName(
    item: DataItem,
    base64File: string,
    header: string,
    key: string,
    formConfig: FormConfigInternal | JoinTable
  ) {
    const mimeType = header.split(':')[1] ?? 'text/plain';
    if (!base64File) {
      return;
    }
    let fileName = `${key}_${item[formConfig.dataSource.idColumn]}`;
    const extension = this.#getFileExtension(mimeType);
    if (extension) {
      fileName = `${fileName}.${extension}`;
    }
    return fileName;
  }

  async #createFile(
    item: DataItem,
    key: string,
    base64String: string,
    formConfig: FormConfigInternal | JoinTable,
    configKey?: string
  ) {
    try {
      const [header, base64File] = base64String.split(';base64,');
      const fileName = this.#createFileName(item, base64File, header, key, formConfig);
      let targetDir = `${this.#opts.FILE_UPLOAD_DIR}/${this.#formId}`;
      if (configKey) {
        targetDir = `${targetDir}/${configKey}`;
      }
      const fullPath = `${targetDir}/${fileName}`;
      await this.#createDir(targetDir);
      await writeFile(fullPath, base64File, { encoding: 'base64' });
      const filePath = `${this.#formId}/${configKey ? configKey + '/' : ''}${fileName}`;
      this.#logger.debug(`Created file ${filePath}`);
      return filePath;
    } catch (err) {
      throw new InternalServerError(`Could not create file for key ${key} and configKey ${configKey}: ${err}`);
    }
  }

  async #removeOldFiles(itemId: string, key: string, configKey?: string) {
    // TODO should we explicitly remove the file that is currently in the database?
    //      this might address for handling join tables
    try {
      let dirPath = `${this.#opts.FILE_UPLOAD_DIR}/${this.#formId}/`;
      if (configKey) {
        dirPath = `${dirPath}${configKey}/`;
      }
      const regexp = new RegExp(`${key}_${itemId}(\\..*)?`);
      let filesInDir: string[];
      try {
        filesInDir = await readdir(dirPath);
      } catch {
        this.#logger.debug(`Directory ${dirPath} does not exist. Not removing any files.`);
        filesInDir = [];
      }
      const filesToRemove = filesInDir
        .filter(filename => regexp.test(filename));
      for (const file of filesToRemove) {
        await unlink(`${dirPath}${file}`);
        this.#logger.debug(`Removed file ${dirPath}${file}`);
      }
    } catch (err) {
      this.#logger.error(err);
    }
  }
}

export default FileProcessor;

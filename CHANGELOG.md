# [3.0.0](https://github.com/formcapture/form-backend/compare/v2.2.0...v3.0.0) (2026-02-17)


### Features

* add KC_PUBLIC_URL env variable ([07ee5d4](https://github.com/formcapture/form-backend/commit/07ee5d4986965b36c4d583921f1ff4a7b8d15027))


### BREAKING CHANGES

* KC_PUBLIC_URL was introduced as required env var

# [2.2.0](https://github.com/formcapture/form-backend/compare/v2.1.0...v2.2.0) (2025-08-27)


### Bug Fixes

* adds missing return ([465c33b](https://github.com/formcapture/form-backend/commit/465c33b219e56f3e7ea1f14ffd6017ffbe85d919))
* apply editorconfig ([f5c919d](https://github.com/formcapture/form-backend/commit/f5c919d750f148bcecb024ded14caf919f83eca5))
* call next() function ([cfb4f8b](https://github.com/formcapture/form-backend/commit/cfb4f8b947d4eff7eab608f4e56e9280fe2f7141))
* format error message ([0e5c89a](https://github.com/formcapture/form-backend/commit/0e5c89afbdd05e4162a05232dec912acb5edfdbd))
* harmonize endings of error messages ([63a6aad](https://github.com/formcapture/form-backend/commit/63a6aaddfc4e0d129eb6b76b17d35e90af3f5edf))
* merge authentisation error to error class files ([2a8571e](https://github.com/formcapture/form-backend/commit/2a8571e50e185804df64c65f513deebccf31e484))
* on verbose -> show granted keycloak resources ([51d2365](https://github.com/formcapture/form-backend/commit/51d236592e0c64004a82ada8871f24c37b0718e1))
* pass log level correctly to env variables ([8a4c20c](https://github.com/formcapture/form-backend/commit/8a4c20c130313bdda223daca4e891d9407018c68))
* remove duplicate registration of error middleware ([9554be9](https://github.com/formcapture/form-backend/commit/9554be9a47270464f06feab662dd22dc3c8ff59e))
* tests for i18n usage ([eff9bb5](https://github.com/formcapture/form-backend/commit/eff9bb59bfdc4e4b88a80fb3e5ecfaf32f9b724a))
* use enum for FormBackendErrorCode ([db7bb4a](https://github.com/formcapture/form-backend/commit/db7bb4a5cd8b551a52b77fe9eb984fd7ef515c42))


### Features

* **backend:** introduce error handling middleware ([f038a53](https://github.com/formcapture/form-backend/commit/f038a53b2ff9f4b5fbda48abc01c68e5a9fa155f))
* check connection via postgrest client on startup ([7e5fa38](https://github.com/formcapture/form-backend/commit/7e5fa38142ba7234d02e5ef690b85b59bae401b5))
* i18n for ItemView ([07d6734](https://github.com/formcapture/form-backend/commit/07d6734a82c083d18e3fb9024ef2cba4e5bea8b3))
* i18n for TableView ([1b04d7b](https://github.com/formcapture/form-backend/commit/1b04d7b731cba334f1efcb243934feba29399b0e))
* introduce i18n for error messages ([9512150](https://github.com/formcapture/form-backend/commit/95121506c782fa56154398fdce1f7344bd8efe3e))
* pass error instances to error middleware ([a4d99e3](https://github.com/formcapture/form-backend/commit/a4d99e320b34c729d12551b9f42773afdb07197c))
* show error messages in frontend ([c39d0cb](https://github.com/formcapture/form-backend/commit/c39d0cb782d3edda11dcc8d8f789965d016a94e6))

# [2.1.0](https://github.com/formcapture/form-backend/compare/v2.0.0...v2.1.0) (2025-08-05)


### Bug Fixes

* disable check for login iframe in dev mode ([a3b14df](https://github.com/formcapture/form-backend/commit/a3b14df6ad7e64ca7570e530b88c3eaab52175fd))
* set header to PostgREST client directly ([e0e32fe](https://github.com/formcapture/form-backend/commit/e0e32fed01d6400882d645c3c0c17bbb9b871dc9))
* test for form processor ([0eced31](https://github.com/formcapture/form-backend/commit/0eced3156c1348c36ba1268e6f82b33f13e43776))


### Features

* show env variables when form backend starts ([df91e5d](https://github.com/formcapture/form-backend/commit/df91e5df2667e37d469a9634a69049edc3bd1063))

# [2.0.0](https://github.com/formcapture/form-backend/compare/v1.1.0...v2.0.0) (2025-07-31)


### Bug Fixes

* improve doc generation ([407645c](https://github.com/formcapture/form-backend/commit/407645c21d6160b5e6fa5653b57b6f68ef294153))
* itemView useEffect hook ([9cd602d](https://github.com/formcapture/form-backend/commit/9cd602daed3a0789c652992afdea42c37d0e7d85))
* typing issues ([e1a16dc](https://github.com/formcapture/form-backend/commit/e1a16dc058c1067500e17a4eda6cbad103b3b4e8))


### chore

* update package lock ([4214e55](https://github.com/formcapture/form-backend/commit/4214e55001ac4b4bc9175e2ac5e2ccdb7e70331d))


### BREAKING CHANGES

* Update node to v24

# [1.1.0](https://github.com/formcapture/form-backend/compare/v1.0.1...v1.1.0) (2025-06-24)


### Bug Fixes

* allow whitespaces in filter ([d698698](https://github.com/formcapture/form-backend/commit/d698698141fd74ce9fac81fac72b39429e1b89ef))
* contains and like filter Op ([9f26cc1](https://github.com/formcapture/form-backend/commit/9f26cc1f29e09a8fc77e7d13c7e09bb4d09833e6))
* if filter is set, we need to pad the data with objects matching the filter ([68fc81a](https://github.com/formcapture/form-backend/commit/68fc81af2f574bace8d85ef587a406620289ad60))
* introduce jest mock for node:fs/promise ([919e844](https://github.com/formcapture/form-backend/commit/919e844f9fababc6d687d67df13ea95258304279))
* readd sourcemap to tsconfig ([99e451c](https://github.com/formcapture/form-backend/commit/99e451c5f334fdd2687cb5c4a2bede20f0312014))
* show pagination total count ([be5b226](https://github.com/formcapture/form-backend/commit/be5b22673ef13956c419690867fb64f1a962e2f9))
* tests ([1dabbc9](https://github.com/formcapture/form-backend/commit/1dabbc9b0442c25134de09ae716642a6d97f6355))
* use Logger of @terrestris/base-util instead of console.log ([252bb9e](https://github.com/formcapture/form-backend/commit/252bb9e6ba21170720359d8af841fba41d0979fd))


### Features

* adds contains filter operation ([0573184](https://github.com/formcapture/form-backend/commit/0573184d8b7aa1c84c847d0cdf79e8cc0bccebd5))
* bump vite to v6 and vitest to v3 ([6e48646](https://github.com/formcapture/form-backend/commit/6e486466d160912676a630cba663b8a39248de16))
* enhance contributing guidelines, add pr template ([076d197](https://github.com/formcapture/form-backend/commit/076d1979cababe6ee143103cda7c03098ecfa839))
* return geojson including all properties ([744bce0](https://github.com/formcapture/form-backend/commit/744bce0a3c76c3b02d28389e99ca4e44e2369402))

## [1.0.1](https://github.com/formcapture/form-backend/compare/v1.0.0...v1.0.1) (2025-06-10)


### Bug Fixes

* checkout sources again to include actual changelog ([e2cce29](https://github.com/formcapture/form-backend/commit/e2cce2914a688343e7a5277354accfaf9244b9d3))

# 1.0.0 (2025-06-10)


* Introduce semantic release and publish of docker images on github registry ([#8](https://github.com/formcapture/form-backend/issues/8)) ([8526521](https://github.com/formcapture/form-backend/commit/8526521ae285ae5d51c9de6089e5b1ac634cf784))


### Bug Fixes

* add NP check for empty lookups ([#4](https://github.com/formcapture/form-backend/issues/4)) ([fb015f3](https://github.com/formcapture/form-backend/commit/fb015f320ff08f4a2cb510abbc6212b5b51f0c64))
* fix release action ([b3af301](https://github.com/formcapture/form-backend/commit/b3af301decb12f42e2fa116179f9adeffda82c4b))
* fix semantic release action ([7f7d7f0](https://github.com/formcapture/form-backend/commit/7f7d7f00583c3ca3a85b338230a6b1a848ffbff3))
* update release.yml ([35c1749](https://github.com/formcapture/form-backend/commit/35c174944688af0b36edef8d8c3f5e68e4873d67))
* update release.yml ([a968916](https://github.com/formcapture/form-backend/commit/a9689167d57e71bd5b60bcad846132d738d448d6))
* update release.yml ([45b96e5](https://github.com/formcapture/form-backend/commit/45b96e5964728ec308a987bc94086cd1c4954ba8))


### Features

* create semantic release action ([c623067](https://github.com/formcapture/form-backend/commit/c623067e42425ad9334e6273ec30b9e86b5a4914))
* init project readme ([7e23fb0](https://github.com/formcapture/form-backend/commit/7e23fb0b345a8fab3453cf752d9668e535ca3a30))
* initial setup ([22df7d0](https://github.com/formcapture/form-backend/commit/22df7d04281ba40d25a82d087130e86e782b2282))


### BREAKING CHANGES

* Introduce semantic versioning

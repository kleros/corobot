# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.1.0 (2020-03-25)


### Features

* add authentication and close [#5](https://github.com/kleros/governor-bot/issues/5) ([54e6178](https://github.com/kleros/governor-bot/commit/54e6178a981f2df57f0c9d45715fd0ebed0fa1a3))
* add basic startup code and fix docs ([b080d50](https://github.com/kleros/governor-bot/commit/b080d502131b4d56ac3e90c1d6a45b11ea704552))
* add configuration and script files ([abc3b54](https://github.com/kleros/governor-bot/commit/abc3b54786bacf33bfaf40e6fc9e166e5747ac64))
* allow disarming the alarm for the session ([ff3059d](https://github.com/kleros/governor-bot/commit/ff3059d8e3fc0c5ec92050a4b8b68c4ede4086d4))
* check that SUBMITTER_ADDRESSES is an array of checksummed addrs ([c2ab904](https://github.com/kleros/governor-bot/commit/c2ab9042d0ce624bffb553f1cc71aa71902394a4))
* execute approved lists ([6f866b7](https://github.com/kleros/governor-bot/commit/6f866b74a70551abedd3a1bb468c13eeecf13531))
* hide disarm alarm notice for balance bot ([0f27445](https://github.com/kleros/governor-bot/commit/0f27445a5b35e2ec8c43e6bf673dbd35b7e1a5a9))
* improve balance bot mail message and close [#4](https://github.com/kleros/governor-bot/issues/4) ([6bd0037](https://github.com/kleros/governor-bot/commit/6bd00377808ad8c3d618d17c04ccf91d5ee58798))
* improve balance log message ([2ffad40](https://github.com/kleros/governor-bot/commit/2ffad4008ba020cf3097ba1658f894aecac9552e))
* make eth balance warning period configurable ([815628d](https://github.com/kleros/governor-bot/commit/815628d368248850d676f39e94bd48ed8516b1fe))
* only notify about low balance every 2 days ([ff66f35](https://github.com/kleros/governor-bot/commit/ff66f3539853f98bf02066870461201ea110e13b))
* refactor and add bots for execution and balance warnings ([245c3fe](https://github.com/kleros/governor-bot/commit/245c3fee1211d3b90c0531bcffe0988459dc96d1))
* remember notifications sent ([460b056](https://github.com/kleros/governor-bot/commit/460b05684da4684b0938249a7cad16a81f2ba359))
* send emails via sendgrid ([d1a89ef](https://github.com/kleros/governor-bot/commit/d1a89ef38e5b545e253ae2c8b5efffbe9f21f0c5))
* send out email warnings ([5210a9b](https://github.com/kleros/governor-bot/commit/5210a9b203b3ff3af53c4ce7dee58dc30b1467c5))
* submit list at end of session, if no one submitted and close [#1](https://github.com/kleros/governor-bot/issues/1) ([c338ef4](https://github.com/kleros/governor-bot/commit/c338ef4719a8c4416ed8d291cb8c413d2b2e0868))
* watch list of addresses instead of just one ([dc1f705](https://github.com/kleros/governor-bot/commit/dc1f70544629fdabbdb526e17ead253b32cfe6a9))


### Bug Fixes

* balance warning bot ([5f3a2d6](https://github.com/kleros/governor-bot/commit/5f3a2d62842746f14f77cbd63cc81415f4538fdc))
* bot verbosity ([6ff19d1](https://github.com/kleros/governor-bot/commit/6ff19d1be66e09c603eba8a33dcd7a6c9f831a74))
* check that returned db object is not null ([8e7e165](https://github.com/kleros/governor-bot/commit/8e7e165a0606c95d188e37f0fc313317d0b6e637))
* don't warn if the submission period is over for the session ([a45802d](https://github.com/kleros/governor-bot/commit/a45802d3cad9874b4332ca827fe8a9153a0cc668))
* expand rules of list submission ([c58ac90](https://github.com/kleros/governor-bot/commit/c58ac90cbf0cf4872fc417f32bab2b3fe4fc8f6f))
* include bot's wallet in submitters list ([db0d8ad](https://github.com/kleros/governor-bot/commit/db0d8ada703d040deba389f402e82f2608e73558))
* incorrect key selection ([0c725e2](https://github.com/kleros/governor-bot/commit/0c725e28e3bb5984653f2f9a45afd547022f7c11))
* killswitch check and address checksum ([aa3d5b6](https://github.com/kleros/governor-bot/commit/aa3d5b647b15e6ac9cafd3b3c9c01612a9594ab4))
* send balance alarm every 3 days ([6a9fb5d](https://github.com/kleros/governor-bot/commit/6a9fb5d0f32626a9f60b5e19bc964a5de4368a43))
* typo in balance bot mail text ([67f65c5](https://github.com/kleros/governor-bot/commit/67f65c53862a60147db2e320e0ce1407ce55e1cf))
* typo in variable name ([6588712](https://github.com/kleros/governor-bot/commit/6588712043c7bc7b74d16a4c3785f826330c61ac))
* typo in warning message ([2b675eb](https://github.com/kleros/governor-bot/commit/2b675ebfd9d90e0051e0d14dc0fe661b1977a307))
* typos ([d82f77e](https://github.com/kleros/governor-bot/commit/d82f77e610596015436b2ce69f1ed50cc22133e2))
* update db after executing submissions ([c2a9c46](https://github.com/kleros/governor-bot/commit/c2a9c46b159e709135f6b7ab9563b7e20292627b))
* verbosity and add docs ([a47ddd8](https://github.com/kleros/governor-bot/commit/a47ddd8b24ec19ddfd3bfb653c5ef71483f4e7d0))

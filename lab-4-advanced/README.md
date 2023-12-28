# Лабораторная работа №3 "Настройка CI/CD для Docker образов"
## Цель
Настроить репозиторий таким образом, что при пуше в основную ветку пересобирается Docker образ и отправляется в [Docker Hub](https://hub.docker.com/), использовать хранилище секретов.
## Задачи
1. Настройка сервера хранения секретов.
2. Создание github action для сборки и отправки Docker образа.
3. Выполнение push в основную ветку, проверка отправки собранного Docker образа.
## Ход работы
В качестве сервиса использовался Node.js сервер из Лабораторной работы №1.
### Настройка сервера хранения секретов
Настройка сервера хранения секретов выполнялась в соотвествии с [руководством от hashicorp](https://developer.hashicorp.com/vault/tutorials/app-integration/github-actions).
1. Установка `vault`
Были выполнены шаги из [инструкции по установкe](https://developer.hashicorp.com/vault/tutorials/getting-started/getting-started-install).
```
$ vault -v
Vault v1.15.4 (9b61934559ba31150860e618cf18e816cbddc630), built 2023-12-04T17:45:28Z
```
2. Запуск сервера c указанием токена
```
vault server -dev -dev-root-token-id root
```
3. Настройка сервера
Был открыт новый терминал, в котором были выполнены команды для настройки сервера секретов.
Указание параметров подключения
```
export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN=root
```
Создание секретов
```
$ vault kv put secret/dockerhub-workflow DOCKER_HUB_USERNAME=tfsiva DOCKER_HUB_ACCESS_TOKEN=***
========= Secret Path =========
secret/data/dockerhub-workflow

======= Metadata =======
Key                Value
---                -----
created_time       2023-12-26T06:42:32.068711189Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1

$ vault kv get secret/dockerhub-workflow
========= Secret Path =========
secret/data/dockerhub-workflow

======= Metadata =======
Key                Value
---                -----
created_time       2023-12-26T06:42:32.068711189Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1

============= Data =============
Key                        Value
---                        -----
DOCKER_HUB_ACCESS_TOKEN    ***
DOCKER_HUB_USERNAME        tfsiva
```
Создание политики доступа
```
$ vault policy write dockerhub-workflow-secret-reader - <<EOF
> path "secret/data/dockerhub-workflow" {
>     capabilities = ["read"]
> }
> EOF
Success! Uploaded policy: dockerhub-workflow-secret-reader

$ GITHUB_REPO_TOKEN=$(vault token create -policy=dockerhub-workflow-secret-reader -format json | jq -r ".auth.client_token")


$ VAULT_TOKEN=$GITHUB_REPO_TOKEN vault kv get secret/dockerhub-workflow
========= Secret Path =========
secret/data/dockerhub-workflow

======= Metadata =======
Key                Value
---                -----
created_time       2023-12-26T06:42:32.068711189Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1

============= Data =============
Key                        Value
---                        -----
DOCKER_HUB_ACCESS_TOKEN    ***
DOCKER_HUB_USERNAME        tfsiva
```
### Создание github action для сборки и отправки Docker образа
 Возможность запуска на локальном устойстве была добавлена по инструкциям в меню репозитория Settings->Actions->Runners. Был написан конфиг `.github/workflows/docker_image_lab_3_advanced.yml` для автоматической сборки и отправки Docker образа.
1. Процесс имеет название.
```
name: Build and push Docker image from lab 3
```
2. Процесс запускается только при пуше в ветку `master` изменений в директории `lab-3-advanced/example-app/` или конфига.
```
on:
  push:
    branches:
      - master
    paths:
      - 'lab-3-advanced/example-app/**'
      - '.github/workflows/docker_image_lab_3_advanced.yml'
```
3. Образ для выполнения: `self-hosted`. Многие возможности образа не используются в процессе, но для запуска доступны только стандартные версии образов ОС `Ubuntu`, что указно в [документации GitHub](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#choosing-github-hosted-runners).
```
runs-on: self-hosted
```
4. Получение секретов из сервера `vault`. Дополнительный опции указывают адрес и токен доступа к серверу, а также пропуск верификации tls и требуемые секреты.
```
- name: Import Secrets
  uses: hashicorp/vault-action@v2.4.0
  with:
    url: http://127.0.0.1:8200
    tlsSkipVerify: true
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/dockerhub-workflow DOCKER_HUB_USERNAME ;
      secret/data/dockerhub-workflow DOCKER_HUB_ACCESS_TOKEN
```
5. Для добавления содержимого репозитория используется шаг `action/checkout@v4`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/actions/checkout).
```
- uses: action/checkout@v4
```
6. Для аутентификации используется шаг `docker/login-action@v3`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/login-action). Реквизиты аутентификации берутся из [секретов Github репозитория](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).
```
- uses: docker/login-action@v3
  with:
    username: ${{ env.DOCKER_HUB_USERNAME }}
    password: ${{ env.DOCKER_HUB_ACCESS_TOKEN }}
```
7. Для сборки и сохранения Docker образа использовался шаг `docker/build-push-action@v5`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/build-push-action). В параметрах шага указаны контекст (рабочая директория) и теги образа и включён флаг пуша в Docker Hub.
```
- uses: docker/build-push-action@v5
  with:
    context: ./lab-3/example-app
    push: true
    tags: tfsiva/example-app:latest , tfsiva/example-app:${{ github.run_number }}
```
### Выполнение push в основную ветку, проверка отправки собранного Docker образа
При добавлении файлов приложения лабораторной работы и изменении конфига процесса осуществлялись попытки создания и отправки образа. Первые несколько раз процесс завершилася с ошибкой из-за неверено написанного конфига.
#### Проверка созданного образа
После успешного завершения процесса в Docker Hub стал доступен созданный образ: https://hub.docker.com/r/tfsiva/example-app.
1. Загрузка образа из Docker Hub.
```
$ docker pull tfsiva/example-app:4
4: Pulling from tfsiva/example-app
Digest: sha256:53741588cd3679b23a628d5c2755baaedc8d2e806509d82464c68b7e6cfc455b
Status: Image is up to date for tfsiva/example-app:4
docker.io/tfsiva/example-app:4
$ docker images | head -2
REPOSITORY                 TAG         IMAGE ID       CREATED          SIZE
tfsiva/example-app         4           3fbdfd215322   33 minutes ago   193MB
```
2. Создание, запуск и проверка контейнера.
```
$ docker run -p 11333:3000 -d -it --env-file example-app/.env 3fbdfd215322
f64718737c95c9e1e7fbc282484ba5d90ac77142b65e1eb4592189a0a758979c
$ curl http://localhost:11333
Hi <3
$ curl http://localhost:11333/?password=123456
Secret meeting location is 45.0723309,39.0377339
```
Контейнер был успешно создан и запущен. Была выполнена проверка работы Node.js сервера.
## Вывод
Цель достигнута: репоизторий настроен для автоматической сборки и публикации образов, все задачи успешно выполнены.

Github actions и аналогичные механизмы предоставляют полезную при разработке и доставке кода возможность автоматизации процессов: например, сборки или тестирования. Возможность бесплатного использования в Github и других сервисах делает подобные механизмы удобным улучшением для небольших проектов. Простай настройка: зачастую десятки строк в конфигурационных файлах и широкий спектр вохможных задач делают механизы CI/CD важной часть подавляющего большинства современных проектов.
# Лабораторная работа №3 "Настройка CI/CD для Docker образов"
## Цель
Настроить репозиторий таким образом, что при пуше в основную ветку пересобирается Docker образ и отправляется в [Docker Hub](https://hub.docker.com/).
## Задачи
1. Создание github action для сборки и отправки Docker образа.
2. Выполнение push в основную ветку, проверка отправки собранного Docker образа.
## Ход работы
В качестве сервиса использовался Node.js сервер из Лабораторной работы №1.
### Создание github action для сборки и отправки Docker образа
Был написан конфиг `.github/workflows/docker_image_lab_3.yml` для автоматической сборки и отправки Docker образа.
1. Процесс имеет название.
```
name: Build and push Docker image from lab 3
```
2. Процесс запускается только при пуше в ветку `master` изменений в директории `lab-3/example-app/` или конфига.
```
on:
  push:
    branches:
      - master
    paths:
      - 'lab-3/example-app/**'
      - '.github/workflows/docker_image_lab_3.yml'
```
3. Образ для выполнения: `ubuntu-22.04`. Многие возможности образа не используются в процессе, но для запуска доступны только стандартные версии образов ОС `Ubuntu`, что указно в [документации GitHub](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#choosing-github-hosted-runners).
```
runs-on: ubuntu-22.04
```
4. Для добавления содержимого репозитория используется шаг `action/checkout@v4`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/actions/checkout).
```
- uses: action/checkout@v4
```
5. Для аутентификации используется шаг `docker/login-action@v3`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/login-action). Реквизиты аутентификации берутся из [секретов Github репозитория](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).
```
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_HUB_USERNAME }}
    password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
```
6. Для сборки и сохранения Docker образа использовался шаг `docker/build-push-action@v5`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/build-push-action). В параметрах шага указаны контекст (рабочая директория) и теги образа и включён флаг пуша в Docker Hub.
```
- uses: docker/build-push-action@v5
  with:
    context: ./lab-3/example-app
    push: true
    tags: tfsiva/example-app:latest , tfsiva/example-app:${{ github.run_number }}
```
### Выполнение push в основную ветку, проверка отправки собранного Docker образа
При добавлении файлов приложения лабораторной работы и изменении конфига процесса осуществлялись попытки создания и отправки образа. Первый несколько раз процесс завершилася с ошибкой из-за неверено написанного конфига и настроенных секретов репозитория.
#### Проверка созданного образа
После успешного завершения процесса в Docker Hub стал доступен созданный образ: https://hub.docker.com/r/tfsiva/example-app.
1. Загрузка образа из Docker Hub.
```
$ docker pull tfsiva/example-app:11
11: Pulling from tfsiva/example-app
9398808236ff: Already exists 
b4340dbb4038: Already exists 
7d026b0a28dd: Already exists 
ae32898c3dd5: Already exists 
56eafaef4745: Pull complete 
6de183275a7f: Pull complete 
3816765eb992: Pull complete 
Digest: sha256:d7b4844d30d0399b2dae44407c72c81aaade415977dc3427429ea36ae8ba6343
Status: Downloaded newer image for tfsiva/example-app:11
docker.io/tfsiva/example-app:11
$ docker images | head -2
REPOSITORY                 TAG       IMAGE ID       CREATED         SIZE
tfsiva/example-app         11        3e6b6533c778   9 hours ago     193MB
```
2. Создание, запуск и проверка контейнера.
```
$ docker run -p 11333:3000 -d -it --env-file .env 3e6b6533c778
97d621cd3544a77d34aaacf33db8fa1749302b9b9a6a89c1f18cce9ea121bab6
$ curl http://localhost:11333
Hi <3
$ curl http://localhost:11333/?password=123456
Secret meeting location is 45.0723309,39.0377339
```
Контейнер был успешно создан и запущен. Была выполнена проверка работы Node.js сервера.
## Вывод
Цель достигнута: репоизторий настроен для автоматической сборки и публикации образов, все задачи успешно выполнены.

Github actions и аналогичные механизмы предоставляют полезную при разработке и доставке кода возможность автоматизации процессов: например, сборки или тестирования. Возможность бесплатного использования в Github и других сервисах делает подобные механизмы удобным улучшением для небольших проектов. Простай настройка: зачастую десятки строк в конфигурационных файлах и широкий спектр вохможных задач делают механизы CI/CD важной часть подавляющего большинства современных проектов.
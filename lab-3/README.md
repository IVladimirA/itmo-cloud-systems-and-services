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
1. Процесс запускается только при пуше в ветку `master` изменений в директории `lab-3/example-app/` или конфига.
```
on:
  push:
    branches:
      - master
    paths:
      - 'lab-3/example-app/**'
      - '.github/workflows/docker_image_lab_3.yml'
```
2. Образ для выполнения: `ubuntu-22.04`. Многие возможности образа не используются в процессе, но для запуска доступны только стандартные версии образов ОС `Ubuntu`, что указно в [документации GitHub](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#choosing-github-hosted-runners).
```
runs-on: ubuntu-22.04
```
3. Для добавления содержимого репозитория используется шаг `action/checkout@v4`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/actions/checkout).
```
- uses: action/checkout@v4
```
4. Для аутентификации используется шаг `docker/login-action@v3`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/login-action). Реквизиты пользователя берутся из [секретов Github репозитория](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).
```
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_HUB_USERNAME }}
    password: ${{ secrets.DOCKER_HUB_PASSWORD }}
```
5. Для сборки и сохранения Docker образа использовался шаг `docker/build-push-action@v5`. Документация по шагу доступна в [открытом репозитории Github](https://github.com/docker/build-push-action). В параметрах шага указаны контекст (рабочая директория) и теги образа и включён флаг пуша в Docker Hub. Реквизиты пользователя берутся из [секретов Github репозитория](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).
```
- uses: docker/build-push-action@v5
  with:
    context: ./lab-3/example-app
    push: true
    tags:
      - ${{ secrets.DOCKER_HUB_USERNAME }}/example-app:latest
      - ${{ secrets.DOCKER_HUB_USERNAME }}/example-app:${{ github.run_number }}
```
### Выполнение push в основную ветку, проверка отправки собранного Docker образа
## Вывод
Github actions и аналогичные механихмы предоставляют полезную при разработке и доставке кода возможность автоматизации процессов: например, сборки или тестирования. Возможность бесплатного использования в Github и других сервисах делает подобные механизмы удобным улучшением для небольших проектов. Простай настройка: зачастую десятки строк в конфигурационных файлах и широкий спектр вохможных задач делают механизы CI/CD важной часть подавляющего большинства современных проектов.
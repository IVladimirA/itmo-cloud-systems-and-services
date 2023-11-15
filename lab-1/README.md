# Лабораторная работа №1 "Лучшие практики работы с Dockerfile"
## Цель
Создать 2 докер файла: с применением плохих практик и без.
## Задачи
1. Создание Dockerfile с применением плохих практик.
2. Описание других плохих практик.
3. Создание Dockerfile без применения плохих практик.
## Ход работы
Был написан код для Node.js сервера.
### Создание Dockerfile с применением плохих практик
Был создан файл `bad-dockerfile` с использованием трех плохих практик.
#### 1. Использование latest версии образа
```
FROM ubuntu:latest
```
При обновлении версии образа сервисы контейнера могут перестать быть совместимы или непредсказуемо изменить логику работы.
#### 2. Использование неоптимального образа
```
FROM ubuntu:latest

...

RUN apt-get update && apt-get install curl -y

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash \
  && apt-get install nodejs
```
Используется неоптимальный образ, для сервера Node.js существуют образы, специально подготовленные для создания серверов.
#### 3. Хранение чувствительной информации внутри Dockerfile
```
ENV PASSWORD="Pa$$w0rd"
```
При получении доступа к файлу злоумышленник получит секретны
#### Проверка работоспособности
```
$ docker build -f bad-dockerfile .
...
$ docker images | head -2
REPOSITORY                 TAG       IMAGE ID       CREATED              SIZE
<none>                     <none>    6e2619e556d6   6 seconds ago        327MB
$ docker run -p 11333:3000 -d -it 6e2619e556d6
553f638ecadca02a80044bd4a17b1df1a1272dce853f5c86173f8134ed1bfac4
$ curl localhost:11333
Hi <3
$ curl http://localhost:11333/?password=Pa\$\$w0rd
Secret meeting location is 45.0723309,39.0377339
```
### Описание других плохих практик
Ниже описаны другие плохие практики в написании Dockerfile, которые не применялись в лабораторной работе.
#### 1. Влияние на внешние процессы.

Процесс сборки образа должен быть [идемпотентным](https://ru.wikipedia.org/wiki/%D0%98%D0%B4%D0%B5%D0%BC%D0%BF%D0%BE%D1%82%D0%B5%D0%BD%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C). Например, не дожно осущеставлятся изменения внешних файлов и содержимого баз данных, пушей в репозитории.
```
ARG npm_token
RUN echo "//registry.npmjs.org/:_authToken=${npm_token}" > .npmrc
RUN npm publish --access public
```
#### 2. Запуск нескольких сервисов, перегруженный командами файл.

Контейнер должен предсотавлять ровно один сервис, назанчение которого прозрачно пользователю. Развёртывание нескольких сервисов в одном контейнере или сложная сборка из нескольких образов с допонительной установкой множества утилит приведёт к проблемам при работе с контейенерами и нивелирует их основные преимущества: небольшой объём, возможность быстрого перезапуска (создания/удаления), простота использования. Ниже представлен пример Dockerfile из [репозитория для WordPress](https://github.com/jbfink/docker-wordpress).
```
FROM ubuntu:latest
MAINTAINER John Fink <john.fink@gmail.com>
RUN apt-get update # Fri Oct 24 13:09:23 EDT 2014
RUN apt-get -y upgrade
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install mysql-client mysql-server apache2 libapache2-mod-php5 pwgen python-setuptools vim-tiny php5-mysql  php5-ldap
RUN easy_install supervisor
ADD ./scripts/start.sh /start.sh
ADD ./scripts/foreground.sh /etc/apache2/foreground.sh
ADD ./configs/supervisord.conf /etc/supervisord.conf
ADD ./configs/000-default.conf /etc/apache2/sites-available/000-default.conf
RUN rm -rf /var/www/
ADD https://wordpress.org/latest.tar.gz /wordpress.tar.gz
RUN tar xvzf /wordpress.tar.gz 
RUN mv /wordpress /var/www/
RUN chown -R www-data:www-data /var/www/
RUN chmod 755 /start.sh
RUN chmod 755 /etc/apache2/foreground.sh
RUN mkdir /var/log/supervisor/
EXPOSE 80
CMD ["/bin/bash", "/start.sh"]
```
### Создание Dockerfile без применения плохих практик.
Был создан файл `Dockerfile` без применения плохих практик.
#### 1. Использование конкретной версии образа
```
FROM node:21.1-alpine3.17
```
Нет зависимости от обновлений образа, образ всегда одинаковый.
#### 2. Использование оптимального образа
```
FROM node:21.1-alpine3.17
```
Используется специальный образ для серверов Node.js. Не требуется дополнительная установка пакетов, из образа исключены лишние пакеты.
#### 3. Хранение чувствительной внутри .env файла
```
ARG PASSWORD
ENV PASSWORD=$PASSWORD
```
Чувствиетльные переменные окружения хранятся в `.env` файле и указываются при запуске контейнера ключом `--env-file`.
#### Проверка работоспособности
```
$ docker build .
...
$ docker images | head -2
REPOSITORY                 TAG       IMAGE ID       CREATED          SIZE
<none>                     <none>    f3598e205a0f   14 seconds ago   193MB
$ docker run -p 11333:3000 -d -it --env-file .env f3598e205a0f
5df70ef4f0c221ffbcc7b20e1bbdfdd592478255bc334b658566d8796ce21a15
$ curl http://localhost:11333
Hi <3
$ curl http://localhost:11333/?password=123456
Secret meeting location is 45.0723309,39.0377339
```
## Вывод
Цель достигнута: созданы и описаны файлы Dockerfile c применением хороших и плохих практик, описаны другие плохие практики. Все задачи успешно выполнены.

При написании Dockerfile очень важно проверять содержимое на наличие плохих практик.\
При неправильном написании образ может быть зависим от внешних обновлений, иметь непредсказуемой поведение,\
содержать излишнюю чувствительную информацию и занимать значительно больше места:
```
$ docker images                                            
REPOSITORY                 TAG       IMAGE ID       CREATED         SIZE                                                                    
<none>                     <none>    686470a3dc26   6 seconds ago   193MB                                                                   
<none>                     <none>    e7e8c758a539   3 minutes ago   327MB
```
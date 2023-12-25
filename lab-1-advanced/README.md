# Лабораторная работа №1* "Лучшие практики работы с Dockerfile"
## Цель
Создать приложение и Dogerfile, при запуске которого приложение будет добавлять запись в базу данных.
## Задачи
1. Создание БД.
2. Написание приложения.
3. Написание и проверка работы Dogerfile'a.
## Ход работы
### Создание БД
#### 1. Запуск СУБД
Была выбрана СУБД `Postgres` и написан `docker-compose,yml`. Для указания данных пользователя в СУБД контйенера необходимо создать файл `.env` и указать необходимые значения аналогично значениям из файла `.env.example`.
Пример заполнения:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```
Запуск контейнера с СУБД:
```
docker compose up -d
[+] Running 1/1
 ✔ Container lab-1-advanced-db-1  Started                                                       0.0s
$ docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED       STATUS         PORTS                                       NAMES
af05827b7eca   postgres:14   "docker-entrypoint.s…"   2 hours ago   Up 3 seconds   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   lab-1-advanced-db-1
```
#### 2. Создание таблицы
Для создания БД и таблицы нужно подключится к контейнеру СУБД, выполнить вход с ранее заданным пользователем (в примере ниже - `admin`) и воспользоваться языком SQL.
```
$ docker exec -it af05827b7eca bash
root@af05827b7eca:/# psql -U admin -d startup_logger
psql (14.10 (Debian 14.10-1.pgdg120+1))
Type "help" for help.

startup_logger=# \conninfo
You are connected to database "startup_logger" as user "admin" via socket in "/var/run/postgresql" at port "5432".
startup_logger=# CREATE TABLE startup_logs(
id SERIAL PRIMARY KEY,
argument VARCHAR(200) NULL);
CREATE TABLE
startup_logger-# \dt
           List of relations
 Schema |     Name     | Type  | Owner 
--------+--------------+-------+-------
 public | startup_logs | table | admin
(1 row)
```
### Написание приложения
В Node.js приложение из обычного варианта этой лабораторной была добавлена логика подключения к БД и создания записей с использованием пакета `node-postgres`. Дополнительно при запуске сервера можно указать параметр, который будет сохранен в таблице `startup_logs` БД `startup_logger`. Для работы необходимо указать в файле `example-app/.env` данные подключения к БД, как это сделано в файле `example-app/.env.example`:
```
POSTGRES_DB=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=0.0.0.0
POSTGRES_PORT=5432
```
Для локальных сборки и запуска можно использовать команды:
```
npm install
node src/index.js "Test message"
Server started on port 3000.
```
Проверка добавления записи:
```
startup_logger=# SELECT * FROM startup_logs;
 id |   argument   
----+--------------
 14 | Test message
(1 row)
```
### Написание и проверка работы Dogerfile'a
Был создан файл `Dogerfile`, который запускает сервер Node.js и передает параметр для записи в БД. При сборке образа указываются два дополнительных параметра: `-f` для указания путя к файлу и `-t` для указания тэга.
```
docker build . -f Dogerfile -t example-app
[+] Building 11.4s (9/9) FINISHED                                                     docker:default
 => [internal] load .dockerignore                                                               0.0s
 => => transferring context: 2B                                                                 0.0s
 => [internal] load build definition from Dogerfile                                             0.0s
 => => transferring dockerfile: 158B                                                            0.0s
 => [internal] load metadata for docker.io/library/node:21.1-alpine3.17                         1.1s
 => [1/4] FROM docker.io/library/node:21.1-alpine3.17@sha256:c8e4f0ad53631bbf60449e394a33c5b8b  0.0s
 => [internal] load build context                                                               0.0s
 => => transferring context: 43.38kB                                                            0.0s
 => CACHED [2/4] WORKDIR /home/example-app                                                      0.0s
 => [3/4] COPY . .                                                                              0.1s
 => [4/4] RUN npm i                                                                            10.1s
 => exporting to image                                                                          0.1s
 => => exporting layers                                                                         0.1s
 => => writing image sha256:fb547ada4c17223dd6349d779543a044a2a594614af3e255cfc22605818cba2a    0.0s
 => => naming to docker.io/library/example-app
```
Запуск контейнера командой `docker run`. Дополнительные флаги: `--env-file` - укзание пути к файлу, `--network` - указание режима сетевой работы для доступности СУБД, которая развернута на хосте.
```
example-app$ docker run --env-file .env --network host -d -it example-app "Message from docker startup"
aefa4c33d285d5cf0989f3bcf4e3caf52270537681307e63c7df9907b7b44480
example-app$ docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS                                       NAMES
aefa4c33d285   example-app   "node src/index.js '…"   10 seconds ago   Up 9 seconds                                                pensive_lovelace
af05827b7eca   postgres:14   "docker-entrypoint.s…"   3 hours ago      Up 36 minutes   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   lab-1-advanced-db-1
```
Список записей после запуска контейнера:
```
startup_logger=# SELECT * FROM startup_logs;
 id |          argument           
----+-----------------------------
 14 | Test message
 15 | Message from docker startup
(2 rows)

example-app$ docker stop aefa4c33d285
aefa4c33d285

startup_logger=# SELECT * FROM startup_logs;
 id |          argument           
----+-----------------------------
 14 | Test message
 15 | Message from docker startup
(2 rows)
```
## Вывод
Цель достигнута: созданы приложение и Dogerfile, при старте контейнера запускается приложения и создается запись с сообщением в БД. Все задачи успешно выполнены.

На собственной машине может быть удобно работать с СУБД в контейнерах. Данные в таком случае сохраняются в директориях на машине, а СУБД можно использовать в удобном формате.
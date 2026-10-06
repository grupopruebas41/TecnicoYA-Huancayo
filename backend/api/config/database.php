<?php
return ['default'=>env('DB_CONNECTION','pgsql'),'connections'=>[
 'pgsql'=>['driver'=>'pgsql','host'=>env('DB_HOST','127.0.0.1'),'port'=>env('DB_PORT',5432),'database'=>env('DB_NAME',env('DB_DATABASE','tecnicoya')),'username'=>env('DB_USER',env('DB_USERNAME','tecnicoya')),'password'=>env('DB_PASSWORD',''),'charset'=>'utf8','prefix'=>'','search_path'=>'public','sslmode'=>env('DB_SSLMODE','prefer')],
 'mysql'=>['driver'=>'mysql','host'=>env('DB_HOST','127.0.0.1'),'port'=>env('DB_PORT',3306),'database'=>env('DB_DATABASE',env('DB_NAME','tecnicoya')),'username'=>env('DB_USERNAME',env('DB_USER','tecnicoya')),'password'=>env('DB_PASSWORD',''),'charset'=>'utf8mb4','collation'=>'utf8mb4_unicode_ci','prefix'=>'','strict'=>true,'engine'=>'InnoDB','timezone'=>'+00:00'],
 'sqlite'=>['driver'=>'sqlite','database'=>env('DB_DATABASE',database_path('database.sqlite')),'prefix'=>'','foreign_key_constraints'=>true]
], 'migrations'=>['table'=>'migrations','update_date_on_publish'=>true]];

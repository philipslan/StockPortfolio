create table portfolio_users (
	username  varchar(64) not null primary key,
	password  varchar(64) NOT NULL,
	email     varchar(256) not null UNIQUE constraint email_val CHECK (email LIKE '%@%')
);

create table portfolio (
	id 			number not null primary key,
	name 		varchar(64) not null,
	cash_amnt 	NUMBER(19,4),
	owner 		varchar(64) not null references portfolio_users(username),
	UNIQUE (owner, name),
	constraint positive_cash_amnt check (cash_amnt >= 0)
);

create sequence portfolio_seq start with 1 increment by 1;

create trigger portfolio_trigger
BEFORE INSERT ON portfolio
FOR EACH ROW
BEGIN
    SELECT portfolio_seq.nextval INTO :new.id FROM dual;
END;
/

create table holdings (
	portfolio_id  	number not null references portfolio(id) on delete cascade,
	symbol  		varchar(16) not null,
	timestamp 		NUMBER NOT NULL,
	amount 			NUMBER(19,4) NOT NULL,
	UNIQUE(portfolio_id, symbol)
);

create table new_stocks (
	symbol 		varchar(16) not null,
	timestamp 	NUMBER not null,
	open 		NUMBER not null,
	high 		NUMBER not null,
	low 		NUMBER not null,
	close 		NUMBER not null,
	volume 		NUMBER not null,
	UNIQUE(timestamp,symbol)
);

create view stocks as select * from new_stocks union select * from cs339.stocksdaily;


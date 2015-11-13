#!/usr/bin/python

#
# Oracle butt-finding
#
#
oracle_base = '/raid/oracle11g/app/oracle/product/11.2.0.1.0'
oracle_sid = 'CS339'
import os
os.putenv('ORACLE_BASE',oracle_base)
os.putenv('ORACLE_HOME',oracle_base+'/db_1')
os.putenv('ORACLE_SID','CS339')
import ctypes; ctypes.cdll.LoadLibrary(oracle_base+'/db_1/lib/libclntsh.so.11.1')



import cx_Oracle as ora
import cgi
import sys
import json
#
# Good grief, we have to generate our own headers?  Crazy.
#
print 'Content-type: text/html\n\n'
con = None

def request(sql,rtype):
	try:
		dsn = ora.makedsn("localhost",1521,"CS339")
		con = ora.connect("psl463", "zld5jD6bH", dsn)
		cur = con.cursor()
		cur.execute(sql)
		if rtype == "insert":
			con.commit()
		if rtype == "query":
			rows = cur.fetchall()
	except ora.Error, e:
		string = "Error %s" % (e.args[0])
		print json.dumps({"result":string})
		sys.exit(1)
	finally:
		if con:
			cur.close()
			con.close()
			if rtype == 'query':
				return rows

if os.environ['REQUEST_METHOD'] == 'GET':
	sql = "select username from portfolio_users"
	rows = request(sql,"query")
	result = []
	for row in rows:
		result.append(row[0])
	print json.dumps(result)

elif os.environ['REQUEST_METHOD'] == 'POST':
	form = cgi.FieldStorage()
	requestval = form['request'].value
	## Sign-up
	if requestval == 'signup':
		sql = "insert into portfolio_users (username, password, email) values ('%s','%s','%s')" % (form['username'].value,form['password'].value,form['email'].value)
		request(sql,"insert")
		sql = "select count(*) from portfolio_users where username='%s' and password='%s' and email='%s'" % (form['username'].value,form['password'].value,form['email'].value)
		rows = request(sql,"query")
		if rows[0][0]:
			print json.dumps({"result":"success"})
	## Login
	if requestval == 'login':
		sql = "select count(*) from portfolio_users where username='%s' and password='%s'" % (form['username'].value,form['password'].value)
		rows = request(sql,"query")
		if rows[0][0]:
			print json.dumps({"result":"success"})
	## Portfolio Queries
	if requestval == 'create_portfolio':
		sql = "insert into portfolio (name,cash_amnt,owner) values ('%s',%f,'%s')" % (form['name'].value, float(form['cash_amnt'].value),form['owner'].value)
		request(sql,"insert")
		sql = "select count(*) from portfolio where name='%s' and cash_amnt = %f and owner='%s'" % (form['name'].value,float(form['cash_amnt'].value),form['owner'].value)
		rows = request(sql,"query")
		if rows[0][0]:
			print json.dumps({"result":"success"})
	if requestval == 'find_all_user_portfolios':
		sql = "select * from portfolio where owner='%s'" % (form['owner'].value)
		rows = request(sql,"query")
		print json.dumps(rows)
	## Holding queries
	if requestval == 'find_all_portfolio_holdings':
		sql = "select * from holdings where portfolio_id = %d" % (int(form['portfolio_id'].value))
		rows = request(sql,"query")
		print json.dumps(rows)
	if requestval == 'find_portfolio_holding':
		sql = "select * from holdings where portfolio_id = %d and symbol= '%s'" % (int(form['portfolio_id'].value), form['symbol'].value)
		rows = request(sql,"query")
		print json.dumps(rows)
	if requestval == 'create_holding':
		sql = "insert into holdings (portfolio_id,symbol,timestamp,amount) values (%d,'%s',%d,%d)" % (int(form['portfolio_id'].value),form['symbol'].value,int(form['timestamp'].value),int(form['amount'].value))
		request(sql,"insert")
	if requestval == 'update_holding':
		sql = "update holdings set amount= amount + %d, timestamp=%d where portfolio_id=%d and symbol='%s'" % (int(form['amount'].value),int(form['timestamp'].value),int(form['portfolio_id'].value),form['symbol'].value)
		request(sql,"insert")
	## Account Balance Queries
	if requestval == 'deposit_portfolio_cash_amnt':
		sql = "update portfolio set cash_amnt= cash_amnt + %f where id=%d" % (float(form['amnt'].value), int(form['id'].value))
		request(sql, "insert")
	if requestval == 'withdraw_portfolio_cash_amnt':
		sql = "update portfolio set cash_amnt= cash_amnt - %f where id=%d" % (float(form['amnt'].value), int(form['id'].value))
		request(sql, "insert")
	## Insert New Stock
	if requestval == 'insert_stock':
		symbol = str(form['symbol'].value)
		timestamp = int(form['timestamp'].value)
		openf = float(form['open'].value)
		high = float(form['high'].value)
		low = float(form['low'].value)
		close = float(form['close'].value)
		volume = int(form['volume'].value)
		sql = "insert into new_stocks (symbol,timestamp,open,high,low,close,volume) values ('%s',%d,%f,%f,%f,%f,%d)" % (symbol,timestamp,openf,high,low,close,volume)
		request(sql, "insert")
		sql = "select count(*) from new_stocks where symbol='%s' and timestamp=%d" % (symbol,timestamp)
		rows = request(sql,"query")
		if rows[0][0]:
			print json.dumps({"result":"success"})
	if requestval == 'get_top_stock_information':
		sql = "select * from (select * from stocks where symbol='%s' order by timestamp desc) where rownum <= %d" % (form['symbol'].value, int(form['rownum'].value))
		result = request(sql,"query")
		print json.dumps(result)
	if requestval == 'get_stock_information':
		sql = "select * from (select * from stocks where symbol='%s' and timestamp >=%d and timestamp <=%d order by timestamp desc)" % (form['symbol'].value,int(form['ltime'].value),int(form['htime'].value))
		result = request(sql,"query")
		print json.dumps(result)
	if requestval == 'COV':
		sql = "select stddev(close)/avg(close) \"COV\" from stocks where symbol='%s' and timestamp>%d" % (form['symbol'].value,int(form['timestamp'].value))
		result = request(sql,"query")
		print json.dumps(result)
	if requestval == 'get_covariance':
		sql = "select stddev(close)/avg(close) \"covariance\" from stocks where symbol='%s' or symbol='%s' and timestamp>%d" % (form['symbol1'].value,form['symbol2'].value,int(form['timestamp'].value))
		result = request(sql,"query")
		print json.dumps(result)
	if requestval == 'get_beta':
		sql = "select stddev(close)/avg(close) \"Beta\" from stocks where symbol in (%s) and timestamp>%d" % (form['symbols'].value,int(form['timestamp'].value))
		result = request(sql,"query")
		print json.dumps(result)
		

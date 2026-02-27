* Sample VFP9 Program File — Forge3 Scanner Test Fixture
* This file contains various VFP patterns for testing the scanner

SET TALK OFF
SET EXACT ON
SET DELETED ON

* --- Macro substitution (RED flag) ---
LOCAL lcTableName
lcTableName = "customers"
USE &lcTableName IN 0

* --- SCATTER/GATHER (YELLOW flag) ---
SELECT customers
GO TOP
SCATTER MEMVAR
m.cust_name = UPPER(m.cust_name)
GATHER MEMVAR

* --- Deep THISFORM nesting (YELLOW flag) ---
* THISFORM.PageFrame1.Page1.Container1.Grid1.Column1.Text1.Value = "test"

* --- SCAN/ENDSCAN loop (YELLOW flag) ---
SELECT invoices
SCAN FOR inv_status = "P"
  REPLACE inv_total WITH inv_subtotal * 1.16
ENDSCAN

* --- DO CASE (complexity pattern) ---
DO CASE
  CASE nOption = 1
    DO proc_sales
  CASE nOption = 2
    DO proc_inventory
  CASE nOption = 3
    DO proc_reports
ENDCASE

* --- DLL DECLARE (RED flag) ---
DECLARE INTEGER GetTickCount IN kernel32.dll
DECLARE INTEGER MessageBox IN user32.dll ;
  INTEGER hWnd, STRING lpText, STRING lpCaption, INTEGER uType

* --- Hardcoded credentials (SECURITY finding) ---
LOCAL lcConnection
lcConnection = "DRIVER={SQL Server};SERVER=192.168.1.100;DATABASE=legacy;UID=sa;PWD=admin123"

* --- SQL injection risk (SECURITY finding) ---
LOCAL lcWhere
lcWhere = "cust_id = '" + ALLTRIM(txtSearch.Value) + "'"
SELECT * FROM customers WHERE &lcWhere INTO CURSOR csrResult

* --- SQL Pass-Through ---
LOCAL lnHandle
lnHandle = SQLCONNECT("ProductionDSN", "sa", "password123")
IF lnHandle > 0
  SQLEXEC(lnHandle, "SELECT * FROM orders WHERE order_date > '2020-01-01'")
  SQLDISCONNECT(lnHandle)
ENDIF

* --- Shell execution (SECURITY finding) ---
RUN /N notepad.exe &lcFileName

* --- EXECSCRIPT (RED flag) ---
LOCAL lcCode
lcCode = "REPLACE ALL status WITH 'X' FOR expired = .T."
EXECSCRIPT(lcCode)

RETURN

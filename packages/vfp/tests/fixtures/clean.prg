* Clean VFP9 Program — no red or yellow flags
* Used to test GREEN detection

SET TALK OFF

FUNCTION CalculateTotal(tnQuantity, tnPrice, tnTaxRate)
  LOCAL lnSubtotal, lnTax, lnTotal
  lnSubtotal = tnQuantity * tnPrice
  lnTax = lnSubtotal * tnTaxRate
  lnTotal = lnSubtotal + lnTax
  RETURN lnTotal
ENDFUNC

FUNCTION FormatDate(tdDate)
  RETURN DTOC(tdDate)
ENDFUNC

RETURN

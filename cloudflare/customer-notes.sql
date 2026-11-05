/* Only customer suggestions change; tour stops and immutable proofs retain their delivery-specific notes. */
DROP TRIGGER IF EXISTS remember_delivered_customer;
CREATE TRIGGER remember_delivered_customer AFTER INSERT ON proofs
WHEN json_extract(NEW.data,'$.status')='zugestellt' AND json_extract(NEW.data,'$.customerId') IS NOT NULL
BEGIN
 INSERT INTO customers(id,search_name,data,last_delivered_at)
 VALUES(json_extract(NEW.data,'$.customerId'),json_extract(NEW.data,'$.customerSearchName'),
 json_object('type',json_extract(NEW.data,'$.type'),'name',json_extract(NEW.data,'$.name'),'street',json_extract(NEW.data,'$.street'),'postalCode',json_extract(NEW.data,'$.postalCode'),'city',json_extract(NEW.data,'$.city'),'phone',json_extract(NEW.data,'$.phone')),
 json_extract(NEW.data,'$.completedAt'))
 ON CONFLICT(id) DO UPDATE SET search_name=excluded.search_name,data=excluded.data,last_delivered_at=excluded.last_delivered_at;
END;
UPDATE customers SET data=json_remove(data,'$.note') WHERE json_type(data,'$.note') IS NOT NULL;

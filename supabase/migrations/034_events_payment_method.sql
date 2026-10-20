-- Forma de recebimento escolhida em "Confirmar Recebimento" (pix, dinheiro, transferencia, cartao, cheque).
-- O modal já enviava este campo, mas a coluna nunca foi criada e o update inteiro era rejeitado.

alter table events add column if not exists payment_method text;

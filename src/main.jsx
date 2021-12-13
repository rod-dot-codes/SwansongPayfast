import React from 'react'
import ReactDOM from 'react-dom'
import PaymentRequest from './PaymentRequest'

var isVoucher = document.location.toString().indexOf("/our-counsellors") === -1;

var loadPaymentCallback = (event) => {
    console.log("React ready to roll with event", event);
    ReactDOM.render(
        <React.StrictMode>
            {isVoucher ? <PaymentRequest transaction_type={"gift-card"} /> : <PaymentRequest transaction_type={"session"} />}
        </React.StrictMode>,
        document.getElementById('swansong-loader')
      )
}

window.loadPaymentCallback = loadPaymentCallback;

console.log("isVoucher", isVoucher);

if (isVoucher === true || window.location.hash  === "#redeem-voucher") {
    window.loadPaymentCallback(null);
}


import React from 'react';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import 'whatwg-fetch';



_.parseErrors = function (data) {
    function _camelCaseToVerbose(text) {
        return text.replace(/(?=[A-Z])/g, ' ');
    }

    function _underscoredToVerbose(text) {
        return text.replace(/[\d_]/g, ' ');
    }

    function _capitalize(text) {
        text = text.toLowerCase();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        return text;
    }

    function _parseErrorItem(item, listPos) {
        var listItemTemplate = _.template(
            '<li class="list-item"><span class="list-item-pos">Item <%= i %></span><%= content %></li>'
        ),
            containerTemplate = _.template('<ul class="item"><%= content %></ul>'),
            output = [];

        _.each(item, function (value, key) {
            var fieldTemplate = _.template(
                '<li class="field"><span class="name"><%- name %></span><%= content %></li>'
            ),
                plainValueTemplate = _.template('<span class="value"><%- value %></span>'),
                plainValue,
                listValue,
                content;

            if (_.isString(value)) {
                plainValue = value;
            } else if (_.isArray(value)) {
                if (_.isString(value[0])) {
                    plainValue = value.join(' ');
                } else {
                    listValue = _parseErrorList(value);
                }
            }

            if (plainValue) {
                content = plainValueTemplate({ value: plainValue });
            } else if (listValue) {
                content = listValue;
            }

            if (content) {
                if (key.search(/[A-Z]/) != -1)
                    key = _camelCaseToVerbose(key);

                if (key.search(/[\d_]/) != -1)
                    key = _underscoredToVerbose(key);

                key = _capitalize(key);

                output.push(fieldTemplate({
                    name: key,
                    content: content
                }));
            }
        });

        output = output.join('');

        if (output) {
            output = containerTemplate({ content: output });
            if (listPos) {
                output = listItemTemplate({
                    i: listPos,
                    content: output
                });
            }
        }

        return output;
    }

    function _parseErrorList(items) {
        var containerTemplate = _.template('<ul class="list"><%= content %></ul>'),
            output = [];

        _.each(items, function (item, i) {
            if (!_.isEmpty(item)) {
                output.push(_parseErrorItem(item, i + 1));
            }
        });

        output = output.join('');

        if (output) {
            output = containerTemplate({ content: output });
        }

        return output;
    }

    if (_.isArray(data)) {
        return _parseErrorList(data);
    } else {
        return _parseErrorItem(data);
    }
};

import * as Sentry from "@sentry/browser";

let isProduction = window.location.toString().indexOf("swansong.life") > -1;
let apiUrl = isProduction ? "https://api.alignd.co.za/swansong/create-payment-request/" : "https://api.staging.alignd.co.za/swansong/create-payment-request/";

let sentryDSN = isProduction ? "https://e5bc5075083f4ab6a3b4e58fc6b3087c@o1054355.ingest.sentry.io/6105536" : "";

let settings = {
    isProduction,
    apiUrl,
    sentryDSN
}

window.sentry = null;

if (sentryDSN) {
    window.sentry = Sentry.init({
        dsn: sentryDSN,

        // Alternatively, use `process.env.npm_package_version` for a dynamic release version
        // if your build tool supports it.
        release: "swansong-web-interface@0.1",
        integrations: [],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 0,

    });
}






console.log("Settings for this URL is", settings)



const voucherSchema = yup.object({
    purchaser_first_name: yup.string().required("Please enter a valid first name"),
    purchaser_last_name: yup.string().required("Please enter a valid last name"),
    purchaser_email: yup.string().email().required("Please enter a valid email address"),
    purchaser_mobile_number: yup.string(),
    different_recipient: yup.boolean().required(),
    recipient_email: yup.string().email().when("different_recipient", {
        is: true,
        then: yup.string().required("Please enter a valid recipient email")
    }),
    recipient_first_name: yup.string().when("different_recipient", {
        is: true,
        then: yup.string().required("Please enter a valid recipient first name")
    }),
    recipient_last_name: yup.string().when("different_recipient", {
        is: true,
        then: yup.string().required("Please enter a valid recipient last name")
    }),
    custom_message: yup.string().when("different_recipient", {
        is: true,
        then: yup.string().required("Please enter a valid custom message that we will send to the recipient, if specified, and added to the gift voucher.")
    }),
}).required();

const normalSchema = yup.object({
    purchaser_first_name: yup.string().required("Please enter a valid first name"),
    purchaser_last_name: yup.string().required("Please enter a valid last name"),
    purchaser_email: yup.string().email().required("Please enter a valid email address"),
    purchaser_mobile_number: yup.string(),
    voucher_code: yup.string(),
}).required();

function ErrorLabel(props) {
    return (
        <label htmlFor={props.field_id} id={props.field_id}>
            {props.field_id in props.errors && <span>{props.errors[props.field_id].message}</span>}
        </label>
    )
}

export default function PaymentRequest(props) {
    const [state, setStatus] = useState({ 'state': 'open' });
    const { register, getValues, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(props.transaction_type == "gift-card" ? voucherSchema : normalSchema)
    });
    const submitPaymentRequest = (data) => {
        let copiedData = JSON.parse(JSON.stringify(data));
        if (copiedData?.voucher_code != undefined && copiedData.voucher_code.length === 0) {
            delete copiedData["voucher_code"];
        }
        if (copiedData?.different_recipient === undefined) {
            copiedData.different_recipient = false;
        }

        copiedData['transaction_type'] = props.transaction_type;
        console.log("Creating Payment Request to the Server")
        setStatus({ 'state': 'request' });

        function handleErrors(response) {
            if (!response.status != 201) {
                if (response.status >= 500) {
                    throw new Error("There was a fatal error handling your request.\
The engineers have been notified!")
                }
                if (response.headers.get("Content-Type").indexOf("application/javascript")) {
                    var error = "";

                }
            }
            return response;
        }

        fetch(settings.apiUrl, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify(copiedData)
        }).then(response => handleErrors(response))
            .then(response => response.json())
            .then(data => {
                window.location.href = data.payment_redirect_url;
                setStatus({ 'state': 'redirect' });
            }).catch(err => {
                if (window.sentry) {
                    Sentry.captureException(err);
                }
                setStatus({ 'state': 'error', err: err });
            });
    }
    return (
        <div className="column is-6 is-offset-3 has-background-festive has-text-white mb-5 px-6 py-5">
            <h2 className="title is-7 is-family-secondary has-text-white mt-6">SESSION BOOKING</h2>
            <div className="columns mb-6">
                <div className="column is-12">
                    <form id="giftVoucherForm" onSubmit={handleSubmit(submitPaymentRequest)}>
                        <div className="field is-horizontal">
                            <div className="field-body">
                                <div className="field">
                                    <p className="control is-expanded">
                                        <ErrorLabel field_id="purchaser_first_name" errors={errors} />
                                        <input type="text" name="purchaser_first_name" {...register("purchaser_first_name")} className="is-family-primary p-2" placeholder="First Name*"
                                            required />
                                    </p>
                                </div>
                                <div className="field">
                                    <p className="control is-expanded">
                                        <ErrorLabel field_id="purchaser_last_name" errors={errors} />
                                        <input type="text" name="purchaser_last_name" {...register("purchaser_last_name")} className="is-family-primary p-2" placeholder="Surname*" required />
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="field is-horizontal">
                            <div className="field-body">
                                <div className="field">
                                    <p className="control is-expanded">
                                        <ErrorLabel field_id="purchaser_email" errors={errors} />
                                        <input type="email" name="purchaser_email" {...register("purchaser_email")} className="is-family-primary p-2" placeholder="Your Email*"
                                            required />
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="field is-horizontal">
                            <div className="field-body">
                                <div className="field">
                                    <p className="control is-expanded">
                                        <ErrorLabel field_id="purchaser_mobile_number" errors={errors} />
                                        <input type="text" name="purchaser_mobile_number" {...register("purchaser_mobile_number")} className="is-family-primary p-2" placeholder="Your Cellphone Number" />
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="field is-horizontal">
                            <div className="field-body">
                                {props.transaction_type == "session" && (
                                    <div className="field">
                                        <p className="control is-expanded">
                                            <ErrorLabel field_id="voucher_code" errors={errors} />
                                            <input type="text" name="voucher_code" {...register("voucher_code")} className="is-family-primary p-2" placeholder="Gift Voucher Code" />
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <br />

                        {props.transaction_type == "gift-card" && (
                            <>
                                <p className="is-size-7 is-family-sans-serif ls-1 mb-5">
                                    RECIPIENT DETAILS
                                </p>

                                <div className="field is-horizontal">
                                    <div className="field-body">
                                        <div className="field">
                                            <p className="control is-expanded">
                                                <ErrorLabel field_id="recipient_first_name" errors={errors} />
                                                <input type="text" name="recipient_first_name" {...register("recipient_first_name")} className="is-family-primary p-2"
                                                    placeholder="Recipient First Name" />
                                            </p>
                                        </div>
                                        <div className="field">
                                            <p className="control is-expanded">
                                                <ErrorLabel field_id="recipient_last_name" errors={errors} />
                                                <input type="text" name="recipient_last_name" {...register("recipient_last_name")} className="is-family-primary p-2"
                                                    placeholder="Recipient Surname" />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="field">
                                    <p className="control">
                                        <ErrorLabel field_id="recipient_email" errors={errors} />
                                        <input type="email" name="recipient_email" {...register("recipient_email")} className="is-family-primary p-2"
                                            placeholder="Recipient Email" />
                                    </p>
                                </div>
                                <div className="field">
                                    <div className="control">
                                        <input type="checkbox" name="different_recipient"  {...register("different_recipient")} value="false" />
                                        <span className="is-family-primary">Please email the voucher directly to recipient</span>
                                    </div>
                                </div>

                                <div className="field">
                                    <p className="control">
                                        <ErrorLabel field_id="custom_message" errors={errors} />
                                        <textarea className="is-family-primary p-2" {...register("custom_message")} id="custom-email-text"
                                            placeholder="Add a custom message that we will add to the gift card" cols="20" rows="5"></textarea>
                                    </p>
                                </div>
                            </>)}
                        <div className="field is-horizontal">
                            <div className="field-body">
                                <div className="field">
                                    <p className="control is-expanded">
                                        <button type="submit"
                                            className="button has-background-black is-link is-size-7 is-family-secondary is-pulled-right is-radiusless is-hovered px-5" disabled={state.status == "request"}>
                                            {props.transaction_type == "gift-card" && <span>PROCEED TO PAYMENT</span>}
                                            {props.transaction_type == "session" && (
                                                <span>PROCEED</span>
                                            )}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}

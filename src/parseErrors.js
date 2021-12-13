import _ from 'underscore';

var parseErrors = function (data) {
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


export default parseErrors;
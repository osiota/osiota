/*
 * Created by Saskia on 27.09.2016.
 *
 * JSON schema validator using "jsonschema"-package which is designed to be fast and simple to use.
 * The latest IETF published draft is v4, this library is mostly v4 compatible.
 *
 * available schemas:
 *      - policy
 *
 * how to use:
 *      var v = require('./module_json_validator');
 *      v.validate(json, schema_name);
 *          - json : object eg. policy
 *          - schema_name : name of a schema eg. 'policy'
 */

var Validator = require('jsonschema').Validator;
var v = new Validator();

// custom patterns -------------------------------------------------------------------------

var action_pattern = new RegExp('^(hide_all|hide_value_and_metadata'+
    '|hide_value|preprocess_value'+
    '|forward_all|block_write'+
    '|allow_write)$');

var node_pattern = new RegExp('TODO');

// custom formats --------------------------------------------------------------------------

Validator.prototype.customFormats.valid_action_extra = function(input) {
    var result;
    if(input.hasOwnProperty('action_extra')){
        if(input.action == 'hide_value_and_metadata'){
            result = v.validate(input.action_extra, v.policy_extra_for_hvam_schema).valid;
            return result;
        }else if(input.action == 'preprocess_value'){
            result = v.validate(input.action_extra, v.policy_extra_for_pv_schema).valid;
            return result;
        }
    }
    return true;
};

// schemas ---------------------------------------------------------------------------------

// hide value and metadata action extra
v.policy_extra_for_hvam_schema =  {
    "type" : "object",
    "properties": {
        "exceptions" : {
            "type" : "array",
            "items" : {
                "type" : "string"
            }
        }
    },
    "additionalProperties": false,
    "required" : ["exceptions"]
}

// preprocess value action extra
v.policy_extra_for_pv_schema = {
    "type": "object",
    "properties":{
        "type" : {
            "type":"string"
        },
        "time" : {
            "type" : ["integer"],
            "minimum": 0
        }
    },
    "additionalProperties": false,
    "required" : ["exceptions"]
}


v.policy_schema = {
    "type": "object",
    "properties": {
        "node_name": {
            "type": "string",
            "minLength": 1
            //TODO check if valid nodename
        },
        "remote": {
            "type": "string"
        },
        "metadata": {
            "type": "object",
            "minProperties": 1,
            "patternProperties": {
                "^(.*)$": {
                    "disallow": ["object","array"]
                }
            }
        },
        "action": {
            "type": "string",
            "pattern": action_pattern
        },
        "action_extra": { // check if right object for action
            "type": "object"
        }
    },
    "additionalProperties": false,
    "required" : ["action"],
    "anyOf" : [
        {"required" : ["node_name"]},
        {"required" : ["remote"]},
        {"required" : ["metadata"]}
    ],
    "format": "valid_action_extra"
};

// exports------------------------------------------------------------------------------------

exports.validate = function (json, schema_name) {
    var schema = v[schema_name];
    if (typeof schema != 'undefined') {
        return v.validate(json, schema);
    } else {
        throw 'The schema does not exist'
    }
};

// testcode -----------------------------------------------------------------------------------

/*
var validate = function (json, schema_name) {
    var schema = v[schema_name];
    if (typeof schema != 'undefined') {
        return v.validate(json, schema);
    } else {
        throw 'The schema does not exist'
    }
};

var policy = {
    node_name: '/TUBS',
    remote: 'app_heating_control',
    metadata: {'hey':'test', 'he':9},
    action: 'hide_value_and_metadata',
    action_extra: {a: ['description']}
    //action: 'preprocess_value'
    //action_extra: {type: average, time: 5}
};

console.log(validate(policy, 'policy_schema'));
*/

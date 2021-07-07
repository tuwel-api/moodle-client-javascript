'use strict'
const http = require('http-debug').http;
const https = require('http-debug').https;
const qs = require('qs')


if (process.env.HTTP_VERBOSE) {
    http.debug = 1;
    https.debug = 1;
}

/**
 * @typedef {Object} Client.Options
 * @property hostname {String}
 * @property path {String}
 * @property method {String}
 * @property headers {Object}
 * @property port {Number}
 * @property Content-Length {String}
 */

/**
 * @typedef {Object} Client.RequestData
 * @property wstoken {String}
 * @property wsfunction {String}
 * @property moodlewsrestformat {String}
 */

class MoodleRestClient {

    /**
     * @class MoodleRestClient
     * @param host {String} Your moodle site host, without protocol, port or slashes. Ex: "your-moodle-site.com"
     * @param token {String} Moodle webservice token, see moodle webservice docs for more information
     * @param [port=80] {Number=} Site port number
     * @param [protocol='http'] {String=} Request protocol, "http" or "https"
     * @param [subdirectory=null] {String=} Moodle site subdirectory. Ex: "/moodle" or "moodle"
     */
    constructor(host, token, {
        port = 80,
        protocol = 'http',
        subdirectory = null
    } = {}) {
        if (protocol === 'http') this.transporter = http
        else this.transporter = https

        this.token = token
        this.setOptions({host, port, subdirectory})
    }

    /**
     * Set Client options
     * @private
     * @param host {String}
     * @param [port=80] {Number=}
     * @param [subdirectory=null] {Number=}
     */
    setOptions({host, port = 80, subdirectory}) {
        var sub = subdirectory
        if (subdirectory == null) {
            sub = ''
        }
        this._options = {
            hostname: host,
            path: `${sub}/webservice/rest/server.php`,
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            port: port
        }
    }

    /**
     * @private
     * @returns {Client.Options}
     */
    get options() {
        return this._options
    }

    /**
     * Prepare request
     * @private
     * @param data {Object}
     * @returns {{options: Client.Options, content: String}}
     */
    prepare(data) {
        let content = qs.stringify(data)
        let options = Object.assign({}, this.options)
        options['Content-Length'] = content.length
        options['headers']['Content-Length'] = content.length
        return {options, content}
    }

    /**
     * Build request data
     * @private
     * @param wsFunction {String}
     * @param key {String}
     * @param value {Array|Object}
     * @returns {Client.RequestData}
     */
    buildData(wsFunction, params) {
        return {
            wstoken: this.token,
            wsfunction: wsFunction,
            moodlewsrestformat: 'json',
            ...params
        }
    }

    /**
     * Send request
     * @param wsFunction {String} Moodle webservice function name
     * @param key {String} Moodle webservice function  parameter key
     * @param value {Array|Object} Moodle webservice function parameter value
     * @returns {Promise}
     */
    send(wsFunction, params) {
        if (!wsFunction) return Promise.reject(new Error('WsFunction required'))

        return new Promise((resolve, reject) => {
            let data = this.buildData(wsFunction, params)
            let {options, content} = this.prepare(data)
            let request = this.transporter.request(options, this.onRequest(resolve, reject).callback)

            request.on('error', reject)
            request.write(content)
            request.end()
        })
    }

    /**
     * On request
     * @private
     * @param resolve {Function}
     * @param reject {Function}
     * @returns {{callback: Function}}
     */
    onRequest(resolve, reject) {
        return {
            callback: (responseObject) => {
                let body = ''

                responseObject.on('data', (chunk) => {
                    body += chunk
                })

                responseObject.on('end', () => MoodleRestClient.onEnd(resolve, reject, body, responseObject))
            }
        }
    }

    /**
     * On end
     * @private
     * @static
     * @param resolve {Function}
     * @param reject {Function}
     * @param body {String}
     * @param responseObject {Object}
     * @returns {{callback: Function}}
     */
    static onEnd(resolve, reject, body, responseObject) {
        let response
        if (responseObject.statusCode >= 400) {
            return reject(new Error(body || `${responseObject.statusCode} - ${responseObject.statusMessage}`))
        }

        try {
            response = JSON.parse(body)
            resolve(response)
        } catch (error) {
            reject(error)
        }
    }

    /**
     * Sets the verbosity level of the http(s) requests
     * @param level (0 = None, 1 = Verbose, 2 = Even more Verbose)
     */
    setVerbosity(level = 1) {
        http.debug = level
        https.debug = level
    }
}

module.exports = MoodleRestClient

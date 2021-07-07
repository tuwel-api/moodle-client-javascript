
# Moodle Client JavaScript

**This is a fork of: github.com/virgilioneto/moodle-rest-client** 

The main motivation in modifying it, was to provide a more flexible way of providing parameters.

## Setup


Install:

1. Add this repository as a submodule to your node.js project: via `git submodule add`.
2. Install its dependencies: `npm install moodle-client-javascript` (assuming you are at the root of your project, and this repository is added as folder moodle-client-javascript) 

For information on variants of instantiating the client, see the original: github.com/virgilioneto/moodle-rest-client

## Usage

You can access WS_functions by supplying their name as a string, and their parameters as a JS-object. We make use of JS promises, so as usual you can access your results with the `.then` method. Many errors are not caught separately, but just returned as a normal response, with exception information in the response fields.

The following snippet will instantiate a client, and collect quizzes from all courses, the current user has access to.

```javascript
const {MoodleRestClient} = require('./moodle-client-javascript');
const clientConfig = {
    protocol: 'https',
    port: '443',
    subdirectory: ''
}
const token = 'YOUR_API_TOKEN'
const client = new MoodleRestClient('<YOUR_MOODLE_DOMAIN>', token, clientConfig)
client.send('mod_quiz_get_quizzes', {courseids: []}).then(console.log)
```
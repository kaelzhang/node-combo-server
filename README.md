[![NPM version](https://badge.fury.io/js/static-combo-server.svg)](http://badge.fury.io/js/static-combo-server)
[![npm module downloads per month](http://img.shields.io/npm/dm/static-combo-server.svg)](https://www.npmjs.org/package/static-combo-server)
[![Build Status](https://travis-ci.org/kaelzhang/static-combo-server.svg?branch=master)](https://travis-ci.org/kaelzhang/static-combo-server)
[![Dependency Status](https://gemnasium.com/kaelzhang/static-combo-server.svg)](https://gemnasium.com/kaelzhang/static-combo-server)

# static-combo-server

<!-- description -->

## Install

```sh
$ npm install -g static-combo-server
```

## Usage

```sh
$ static-combo-server [--config ./config.ini]
```

- `--config <path>` define the configuration file which supports ini. Default to `~/.static-combo-server/config.ini`. If `~/.static-combo-server/config.ini` not exists, then create one with the default configurations.

- `--port <port>` define the port to listen, default to `8888`

## default `config.ini`

```
port = 8888 # --port > port in ini
root = ~/.static-combo-server/static/
```

## Logic

```
http://localhost:8888/concat/mod~a.js,mod~b.js

->

readFile: <root>/mod/a.js, <root>/mod/b.js
concat: join with `\n\n` 
```

if any file is not found, returns 404

#### header(express)

#### headers -> http protocal(apache)

- `Content-Type`: depends on the extension of the last file.
	- `.js`: 'application/x-javascript'
	- `.css`: 'text/css'
- `Content-Length`: file length

#### Cache

Save to 
- hardware: `<root>/concat/mod~a.js,mod~b.js`
- lrucache: `{'mod~a.js,mod~b.js': {time: '', content: ''}}`

lrucache > hardware > readFile


#### concurrency

`mod~a.js,mod~b.js`

```
var EE = require('events');

function Queue(){}
util.inherits(Queue, EE);

var queue = new Queue()


http.createServer(function(req, res){
	queue.on('ready:mod~a.js,mod~b.js', function(response){
	    response.pipe(res)
	})
	
	if(!queue.has('mod~a.js,mod~b.js')){
		queue.add('mod~a.js,mod~b.js');
		getResponse('mod~a.js,mod~b.js', function(err, response){
		   queue.emit('ready:mod~a.js,mod~b.js', response); 
		})
	}
});
```


### dependencies

- ini(npm)
- async(npm)
- http(node)
- express(npm)
- commander(npm)
- home(npm)
- fse(npm), async, no sync
- fs(node)
- lru-cache(npm)
- request(npm)

## License

MIT



```
// Concat:
// mod/a.js
```

1. 代码可以上线
－ cache
－ concurrency
2. pm2，可以部署，nodejs: cluster
3. 重构
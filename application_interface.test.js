#!/usr/bin/env node

const helper = require("./test/helper_test.js");
const test = helper.test(__filename);

const { EventEmitter } = require('events');
const { ApplicationInterface } = require("./application_interface.js");
const { BaseApp } = require("./osiota-app.js");

const eventemitter = new EventEmitter();

class mock_app extends BaseApp {
	init(node, app_config, main) {
		eventemitter.emit("init");
	}
	unload(node, app_config, main) {
		eventemitter.emit("unload");
	}
	static cli() {
		eventemitter.emit("cli");
	}
}

const mock_node = {
	"node": ()=>{
		return mock_node;
	},
	"connect_schema": ()=>{},
	"connect_config": ()=>{},
	"announce": ()=>{},
};
const mock_main = {
	"require": async ()=>{
		return mock_app;
	},
	"load_schema": async ()=>{
		return {};
	},
	"node": ()=>{
		return mock_node;
	}
};
const mock_loader = {
	"app_register": ()=>{ return "my_id" },
	"app_unregister": ()=>{ },
	"load": ()=>{
		return [];
	},
};

let ai;
test('construct', async (t)=>{
	ai = new ApplicationInterface(mock_main, mock_loader, mock_node, {
		"name": "example"
	});
	t.equal(ai.state, ApplicationInterface.state_uninited, "state");
});

test('start', async (t)=>{
	t.plan(2);
	eventemitter.once("init", ()=>{
		t.ok(true, "function call");
	});
	await ai.start();
	t.equal(ai.state, ApplicationInterface.state_running, "state");
});

test('restart', async (t)=>{
	t.plan(3);
	eventemitter.once("unload", ()=>{
		t.ok(true, "function call");
	});
	eventemitter.once("init", ()=>{
		t.ok(true, "function call");
	});
	await ai.restart();
	t.equal(ai.state, ApplicationInterface.state_running, "state");
});

test('deactivate', async (t)=>{
	t.plan(2);
	eventemitter.once("unload", ()=>{
		t.ok(true, "function call");
	});
	await ai.deactivate();
	t.equal(ai.state, ApplicationInterface.state_deactive, "state");
});
test('activate', async (t)=>{
	t.plan(2);
	eventemitter.once("init", ()=>{
		t.ok(true, "function call");
	});
	await ai.activate();
	t.equal(ai.state, ApplicationInterface.state_running, "state");
});

test('stop', async (t)=>{
	t.plan(2);
	eventemitter.once("unload", ()=>{
		t.ok(true, "function call");
	});
	await ai.stop();
	t.equal(ai.state, ApplicationInterface.state_unloaded, "state");
});

test('start again', async (t)=>{
	t.plan(2);
	eventemitter.once("init", ()=>{
		t.ok(true, "function call");
	});
	await ai.start();
	t.equal(ai.state, ApplicationInterface.state_running, "state");
});

test('stop', async (t)=>{
	t.plan(2);
	eventemitter.once("unload", ()=>{
		t.ok(true, "function call");
	});
	await ai.stop();
	t.equal(ai.state, ApplicationInterface.state_unloaded, "state");
});

test('cli', async (t)=>{
	t.plan(2);
	eventemitter.once("cli", ()=>{
		t.ok(true, "function call");
	});
	await ai.cli();
	t.ok(true, "cli");
});

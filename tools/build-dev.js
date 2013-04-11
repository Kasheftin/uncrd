({
	appDir: "../source",
	baseUrl: "./",
	dir: "../public",
	paths: {
		"jquery": "lib/jquery-1.8.2-amd",
		"knockout": "lib/knockout-2.2.0-mod",
		"knockout-mapping": "lib/knockout.mapping-2.3.3",
		"knockout-repeat": "lib/knockout.repeat-1.4.2-mod",
		"requireLib": "lib/require-2.1.1",
		"text": "lib/require.text-2.0.3",
		"jquery-cookie": "lib/jquery.cookie-1.3-mod",
		"jquery-textarea-caret": "lib/jquery.textarea.caret",
		"jquery-animateBackgroundColor": "lib/jquery.animateBackgroundColor",
		"eventsEmitter": "lib/eventsEmitter",
		"stringTemplateEngine": "js/stringTemplateEngine",
		"widgetBinding": "js/widgetBinding",
		"popoverBinding": "js/popoverBinding",
		"executeOnEnterBinding": "js/executeOnEnterBinding",
		"windowManager": "js/windowManager",
		"router": "js/router",
		"widget": "js/widget",
		"config": "js/config",
		"core": "js/core",
		"auth": "js/auth"
	},
	shim: {
		"bootstrap": ["jquery"]
	},
	optimize: "none",
	namespace: "uncrd",
	modules: [
		{
			name: "js/main",
			include: ["requireLib","text"]
		}
	],
	optimizeAllPluginResources: true
})

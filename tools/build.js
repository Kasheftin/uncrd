({
	appDir: "../source",
	baseUrl: "./",
	dir: "../public",
	paths: {
		"jquery": "lib/jquery-1.8.2",
		"knockout": "lib/knockout-2.2.0-mod",
		"requireLib": "lib/require-2.1.1",
		"text": "lib/require.text-2.0.3",
		"eventsEmitter": "lib/eventsEmitter",
		"stringTemplateEngine": "js/stringTemplateEngine",
		"widgetBinding": "js/widgetBinding",
		"windowManager": "js/windowManager",
		"widget": "js/widget",
		"core": "js/core",
	},
	namespace: "uncrd",
	modules: [
		{
			name: "js/main",
			include: ["requireLib","text"]
		}
	],
	optimizeAllPluginResources: true
})

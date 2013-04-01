require(["jquery","knockout","core","stringTemplateEngine","widgetBinding"],function($,ko,Core) {
  var core = new Core();
  core.on("ready",function() {
    ko.applyBindings(core);
    core.emit("binded");
  });
  core.initialize();
});
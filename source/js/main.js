
require.config({
  config: {
    text: {
      useXhr: function (url, protocol, hostname, port) {
        // allow cross-domain requests
        // remote server allows CORS
        return true;
      }
    }
  }
});

require(["jquery","knockout","core","stringTemplateEngine","widgetBinding","popoverBinding","executeOnEnterBinding","knockout-repeat","jquery-cookie","jquery-animateBackgroundColor"],function($,ko,Core) {
  var core = new Core();
  core.on("ready",function() {
    ko.applyBindings(core);
    core.emit("binded");
  });
  core.initialize();
});



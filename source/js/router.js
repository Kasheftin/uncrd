define(["jquery","knockout","eventsEmitter"],function($,ko,EventsEmitter) {

// Формат путей в роутере: 
// #!uncrd!name:photo,id:10569;

	var Router = function(core) {
		var self = this;
		this.core = core;

		this.hashchange = function() {
			if (!self._disableHashChange) {
				var ar = window.location.hash.match(/\!uncrd\!(.*?);/);
				if (!ar || ar.length < 2) return self.clear();

				var obj = {};
				$.each(ar[1].split(/,/),function(i,v) {
					var ar1 = v.split(/:/);
					if (ar1[0].length > 0 && ar1[1].length > 0)
						obj[ar1[0]] = ar1[1];
				});
				if (obj.name && (obj.name == "photo" || obj.name == "profile"))
					self.core.open(obj);
			}
			self._disableHashChange = false;
		}

		this.set = function(obj) {
			var str = "";
			$.each(obj,function(key,value) {
				str += (str.length>0?",":"") + key + ":" + value;
			});
			var hash = window.location.hash.replace(/\!uncrd\!(.*?);/,"") + "!uncrd!" + str + ";";
			if (window.location.hash != hash) {
				self._disableHashChange = true;
				window.location.hash = hash;
			}
		}

		this.clear = function() {
			var hash = window.location.hash.replace(/\!uncrd\!(.*?);/,"");
			if (window.location.hash != hash) {
				self._disableHashChange = true;
				window.location.hash = hash;
			}
		}

		this.firstHashTrigger = function() {
			self.hashchange();
			self.core.off("ready",self.firstHashTrigger);
		}
	}

	$.extend(Router.prototype,EventsEmitter.prototype);

	Router.prototype.turnOn = function() {
		$(window).on("hashchange",this.hashchange);
	}

	Router.prototype.turnOff = function() {
		$(window).off("hashchange",this.hashchange);
	}

	Router.prototype.initialize = function() {
		this.turnOn();
		this.core.on("ready",this.firstHashTrigger);
		this.emit("ready");
	}

	Router.prototype.destroy = function() {
		this.turnOff();
	}

	return Router;
});
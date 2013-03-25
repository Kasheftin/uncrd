define(["jquery","knockout"],function($,ko) {
	var PopoverWindow = function(o) {
		var self = this;

		this.header = ko.observable("");
		this.content = ko.observable("");
		this.isHidden = ko.observable(true);
		this.position = ko.observable(null);
		this.parentContainer = $(o.options.data.element);

		o.options.data.data.subscribe(function(data) {
			if (data) { 
				if (typeof data == "string")
					data = {message:data};
				data.message = (typeof data.message == "string" ? data.message : data.message.join("<br>"));
				this.header(data.type == "error" ? "Ошибка" : (data.type == "success" ? "Успех" : ""));
				this.content(data.message);
				this.isHidden(false);
			}
			else
				this.isHidden(true);
		},this);

		this.close = function() {
			this.isHidden(true);
		}

		this.recalculatePosition = function() {
			var p = {display: this.isHidden() ? "none" : "block"};
			this.position(p);
			p.top = this.parentContainer.position().top + this.parentContainer.outerHeight();
			p.left = this.parentContainer.position().left + this.parentContainer.outerWidth()/2 - this.element.outerWidth()/2;
//			p.top = this.parentContainer.offset().top + this.parentContainer.outerHeight();
//			p.left = this.parentContainer.offset().left + this.parentContainer.outerWidth()/2 - this.element.outerWidth()/2;
			p.top = Math.floor(p.top) + "px";
			p.left = Math.floor(p.left) + "px";
			this.position(p);
		}

		this.isHidden.subscribe(function(b) {
			if (!b)
				$(document).one("click",function() {
					self.isHidden(true);
				});
			self.recalculatePosition();
		});

		this.domInit = function(self,element,firstDomChild) {
			this.element = $(firstDomChild);
		}
	}


	return PopoverWindow;
});
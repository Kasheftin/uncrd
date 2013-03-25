define(["knockout"],function(ko) {

	// Widget содержит общие для всех виджетов методы, которые примешиваются в прототип

	var Widget = function() { }

	Widget.prototype.isWidget = true;

	Widget.prototype.destroy = function(options) {
		if (this.childrenWidgets)
			while (this.childrenWidgets.length > 0)
				this.childrenWidgets[0].destroy();
		if (typeof this.domDestroy == "function")
			this.domDestroy();
		if (this.viewModel.childrenWidgets)
			while (this.viewModel.childrenWidgets.indexOf(this) != -1)
				this.viewModel.childrenWidgets.splice(this.viewModel.childrenWidgets.indexOf(this),1);
		if (!options || !options.keepDOM)
			ko.removeNode(this.element);
	}

	Widget.prototype.asObservable = function(v,defaultV) {
		if (ko.isObservable(v) || ko.isComputed(v)) return v;
		return ko.observable(typeof v == "function" ? v() : (typeof v == "undefined" ? defaultV : v));
	}

	return Widget;
});
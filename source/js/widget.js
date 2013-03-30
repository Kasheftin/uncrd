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
		if (this._viewModel.childrenWidgets)
			while (this._viewModel.childrenWidgets.indexOf(this) != -1)
				this._viewModel.childrenWidgets.splice(this._viewModel.childrenWidgets.indexOf(this),1);
		if (!options || !options.keepDOM)
			ko.removeNode(this._element);
	}

	Widget.prototype.asObservable = function(v,defaultV) {
		if (ko.isObservable(v) || ko.isComputed(v)) return v;
		return ko.observable(typeof v == "function" ? v() : (typeof v == "undefined" ? defaultV : v));
	}

	// Удобно, если эти методы сразу присутствуют в виджете
	//Ессно их можно переопределить в конструкторе виджета
	Widget.prototype.open = function() {
		if (this.core) return this.core.open.apply(this,arguments);
		return function() { };
	}
	Widget.prototype.o = function() {
		if (this.core) return this.core.o.apply(this,arguments);
 		return function() { };
	}

	return Widget;
});
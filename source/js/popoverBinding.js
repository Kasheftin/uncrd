define(["jquery","knockout"],function($,ko) {
	ko.bindingHandlers.popover = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var holder = document.createElement("div");
			element.appendChild(holder);
			ko.createWidget(holder,{name:'popover',data:{data:valueAccessor(),element:element}},viewModel);
		}
	}
});
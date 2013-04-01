define(["jquery"],function($) {
	var TopBar = function(options) { }
	TopBar.prototype.domInit = function(self,element,firstDomChild) {
		$(firstDomChild).slideDown();
	}
	return TopBar;
});
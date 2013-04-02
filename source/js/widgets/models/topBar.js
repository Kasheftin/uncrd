define(["jquery"],function($) {
	var TopBar = function(options) { }
	TopBar.prototype.domInit = function(self,element,firstDomChild) {
		console.log("slideDown",firstDomChild);
		$(firstDomChild).hide().slideDown();
	}
	return TopBar;
});
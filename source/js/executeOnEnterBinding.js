define(["jquery","knockout"],function($,ko) {
    ko.bindingHandlers.executeOnEnter = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();
            $(element).keypress(function (event) {                                 
                var keyCode = (event.which ? event.which : event.keyCode);          
                if (keyCode === 10 || keyCode == 13 && event.ctrlKey) {
                    allBindings.executeOnEnter.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };
});

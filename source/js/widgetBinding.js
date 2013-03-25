define(["jquery","knockout","eventsEmitter","widget","text"],function($,ko,EventsEmitter,Widget) {

	ko.bindingHandlers.widget = {
		init: function() {
	    	return { controlsDescendantBindings: true };
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var core = bindingContext.$root.core;
			var val = ko.utils.unwrapObservable(valueAccessor());
			if (!val) return;
			if (typeof val == "string")
				val = {name:val};

			if (val.name)
				val.name = ko.utils.unwrapObservable(val.name);
			if (val.template)
				val.template = ko.utils.unwrapObservable(val.template);

			require([core.config.publicBaseUrl + "/js/widgets/models/" + val.name + ".js","text!" + core.config.publicBaseUrl + "/js/widgets/templates/" + (val.template?val.template:val.name) + ".html"],function(Model,html) {

				if (typeof Model == "function") {
					$.extend(Model.prototype,EventsEmitter.prototype);
					$.extend(Model.prototype,Widget.prototype);
					// core проставляем у прототипа потому что на него часто ссылаемся в конструкторе
					Model.prototype.core = core;
					Model.prototype.open = core.open;
				}

				// инициализация объекта виджета, засовываем туда параметров по максимуму
				var w = typeof Model == "function" ? new Model({
					element: element,
					options: val,
					valueAccessor: valueAccessor,
					allBindingsAccessor: allBindingsAccessor,
					viewModel: viewModel,
					bindingContext: bindingContext,
					html: html
				}) : Model;

				// ссылки ставим в конкретном объекте а не в прототипе!!!
				// эти две переменных ставим здесь, они нужны, когда удаляем виджет
				// в случае удаления виджета смотрим его парент, а это viewModel, и сносим оттуда ссылку + удаляем domNode с его элементом element
				w.viewModel = viewModel;
				w.element = element;

				// регистрируем виджет в childrenWidgets у парента, чтобы из парента к нему был доступ
				if (!viewModel.childrenWidgets)
					viewModel.childrenWidgets = [];
				viewModel.childrenWidgets.push(w);

				// renderTemplate здесь использует кастомный stringTemplateEngine
				ko.renderTemplate(element,bindingContext.extend({$data: w}),{html:html},element);

				// часто нужна ссылка на dom шаблона, пытаемся получить хотя бы dom первого тега
				// если шаблон виджета обернут в div, первый тег и есть весь html шаблона
				var firstDomChild = ko.virtualElements.firstChild(element);
				while (firstDomChild && firstDomChild.nodeType != 1)
					firstDomChild = ko.virtualElements.nextSibling(firstDomChild);

				if (w.requiresLoading) {
					w.isReady = false;
					w.on("ready",function() {
						w.isReady = true;
					});
				}

				// domInit - инициализация, которая живет внутри создаваемого виджета
				if (w.domInit && typeof w.domInit == "function")
					w.domInit(w,element,firstDomChild);

				// callback - метод, который может быть указан в паренте
				// иначе никак не получить ссылку на создаваемый виджет
				if (val.callback && typeof val.callback == "function")
					val.callback(w,element,firstDomChild);
			});
		}
	}

	ko.virtualElements.allowedBindings.widget = true;

	ko.createWidget = function(node,widgetOptions,viewModel) {
		console.log("createWidget with options",widgetOptions);
		var r = ko.applyBindingsToNode(node,{widget: widgetOptions},viewModel);
	}

});

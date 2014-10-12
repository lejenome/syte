"use strict";
var $url;

var allComponents = [],
    enabledServices = [];

window.currSelection = "home";

function setupLinks(settings) {
    var li, link, service;
    allComponents = Object.keys(settings.services);
    allComponents.forEach(function(service) {
        if (settings["services"][service]) enabledServices.push(service);
    });

    //CREATE LINKS ITEMS FOR ENABLED SERVICES
    var main_nav = document.getElementsByClassName("main-nav")[0];
    main_nav.innerHTML = "";
    if (settings["blog_platform"].length) {
        var blog = settings["blog_platform"];
        li = document.createElement("li");
        link = document.createElement("a");
        link.href = "/";
        link.id = "home-link";
        link.textContent = "Home";
        li.appendChild(link);
        main_nav.appendChild(li);
    }
    var i;
    for (i = 0; i < enabledServices.length; i++) {
        service = enabledServices[i];
        li = document.createElement("li");
        link = document.createElement("a");
        link.href = settings["services_settings"][service]["url"];
        if (window[service + "Service"])
            link.textContent = window[service + "Service"].displayName;
        else
            link.textContent = service[0].upperCase + service.slice(1);
        link.id = service + "-link";
        li.appendChild(link);
        main_nav.appendChild(li);
    }
    if (settings["fields"]["email"].length) {
        li = document.createElement("li");
        link = document.createElement("a");
        link.href = "mailto:" + settings["fields"]["email"] + "?subject=Hello";
        link.textContent = "Contact";
        link.id = "contact-link";
        li.appendChild(link);
        main_nav.appendChild(li);
    }

    //PROCESS LINKS CLICK EVENT
    $("a").click(function(e) {
        if (e.which === 2)
            return;
        e.preventDefault();
        e.stopPropagation();

        if (this.href === $url)
            return;

        var url = $.url(this.href.replace("/#!", ""));
        $url = this.href;
        if (this.id === "home-link" /*&& window.location.pathname == "/"*/ ) {
            adjustSelection("home");
            return;
        } else {
            var i;
            for (i = 0; i < enabledServices.length; i++) {
                var service = enabledServices[i];
                if (this.id === service + "-link") {
                    var setupFunct = "setup" + service[0].toUpperCase() + service.slice(1);
                    //TODO: get ride of old code
                    if (window[service + "Service"]) // if service code updated to lastest syteup service design
                        adjustSelection(service, setupService.bind(this, service, url, this, settings["services_settings"][service]));
                    else
                        adjustSelection(service, window[setupFunct].bind(this, url, this, settings["services_settings"][service]));
                    return;
                }
            }
        }
        window.location = this.href;

    });
}

function adjustSelection(component, callback) {
    var transition,
        $currProfileEl;

    if (currSelection !== "home") {
        $currProfileEl = $("#" + currSelection + "-profile");
        transition = $.support.transition && $currProfileEl.hasClass("fade");
        $currProfileEl.modal("hide");
        if (callback) {
            if (transition) {
                $currProfileEl.one($.support.transition.end, callback);
            } else {
                callback();
            }
        }
    } else if (callback) {
        callback();
    }

    $(".main-nav").children("li").removeClass("sel");
    $("#" + component + "-link").parent().addClass("sel");

    if (component === "home")
        $url = null;

    window.currSelection = component;
}

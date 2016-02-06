﻿exports.create = function() {
    'use strict';

    var dialog = new function() {
        var self = this;

        self.Body = null;
        self.BodyViewModel = {};
        self.IsVisible = false;
        self.IsChecked = false;
        self.WithOption = false;
        self.OptionText = '';
        self.IsSaveVisible = true;
        self.AreButtonsDisabled = false;
        self.ValidationErrorText = '';
        self.onChecked = function() {

        };

        self.save = function() {
            self.IsVisible = false;
        };

        self.cancel = function() {
            self.IsVisible = false;
        };
    };
    return function() {
        dialog.Body = null;
        dialog.BodyViewModel = {};
        dialog.IsVisible = false;
        dialog.IsSaveVisible = true;
        dialog.IsChecked = false;
        dialog.WithOption = false;
        dialog.OptionText = '';
        dialog.AreButtonsDisabled = false;
        dialog.ValidationErrorText = '';

        return dialog;
    };
};
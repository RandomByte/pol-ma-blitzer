sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/GroupHeaderListItem",
	"sap/m/MessageBox"
], function(Controller, JSONModel, GroupHeaderListItem, MessageBox) {
	"use strict";
	return Controller.extend("pol.ma.blitzer.controller.App", {
		onInit: function() {
			this.oModel = new JSONModel();
			this.getView().setModel(this.oModel);
			this.fetchData();
		},

		fetchData: function() {
			var that = this;
			this.getView().setBusy(true);
			fetch("/api/latestPost").then(function(res) {
				if (!res.ok) {
					throw new Error("HTTP Error: " + res.statusText);
				}
				return res.json();
			}).then(function(data) {
				that.getView().setBusy(false);
				that.oModel.setData(data);
			}, function(error) {
				that.getView().setBusy(false);
				console.log(error);
				MessageBox.alert("Unexpected error: " + error.message);
			});
		},

		getGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
		}
	});
});

'use strict';
imports.gi.versions.Gtk = '4.0';
const GLib = imports.gi.GLib;
// const Adw = imports.gi.Adw;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const qActionTpl = Gio.File.new_for_path('.local/share/gnome-shell/extensions/quicktext@brainstormtrooper.github.io/interface.ui');
const [, qActionWindow] = qActionTpl.load_contents(null);

var qWindow = GObject.registerClass({
  GTypeName: 'qWindow',
  Template: qActionWindow,
  InternalChildren: ['form_area', 'listBox', 'openButton', 'toast_overlay']
}, class extends Gtk.ApplicationWindow {
  vfunc_close_request() {
    super.vfunc_close_request();
    this.run_dispose();
  }
});

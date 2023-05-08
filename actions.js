#!/usr/bin/gjs
'use strict';
imports.gi.versions.Gtk = '4.0';
imports.searchPath.unshift('.local/share/gnome-shell/extensions/quicktext@brainstormtrooper.github.io');
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext;
const GioSSS = Gio.SettingsSchemaSource;
const { qWindow } = imports.interface;

const QuickText = GObject.registerClass( // eslint-disable-line
  {
    GTypeName: 'QuickText'
  },
  class QuickText extends Gtk.Application {
    _init () {
      this.ID = 'com.github.brainstormtrooper.QuickText';
      super._init({
        application_id: this.ID
      });
      GLib.set_prgname(this.application_id);
      GLib.set_application_name('QuickText');

    }
    vfunc_shutdown () {
      // this._destroyUI();
      // TODO: see what cleanup needs to be done and create function
      super.vfunc_shutdown();
    }
    vfunc_activate () {
      super.vfunc_activate();
      // Create the application window
      /*
      this._window = new Gtk.ApplicationWindow({
        application: this,
        title: 'QuickText',
        default_height: 400,
        default_width: 600
      }); 
      */  
      const window = new qWindow({ application: this });
      window._listBox.append(this.getListUI());
      window.present();
      // this._window.present();
    }
    vfunc_startup() {
      super.vfunc_startup();
    }
    
    getSettings () {
      // ["quick-filepath", "quick-multiline", "quick-pendlocation", "quick-append", "quick-hotkey", "quick-prepend"]

      const schemaId = 'org.gnome.shell.extensions.quicktext';
      const schemaSource = GioSSS.new_from_directory('.local/share/gnome-shell/extensions/quicktext@brainstormtrooper.github.io/schemas', null, true);
      const schema = schemaSource.lookup(schemaId, true);
      const schemaObj = { settings_schema: schema }
      return new Gio.Settings(schemaObj);
      // log(settings.get_string('quick-filepath'));
    }

    getListUI () {
      let items = [];
      const listBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL
      });
      try {
        let P = this.doList();
        // items = await 
        P.then(items => {
          log('items: ', items);     
        
        
          items.forEach(item => {
            const liBox = new Gtk.Box({
              orientation: Gtk.Orientation.VERTICAL
            });
            const liLabel = new Gtk.Label({
              label: item
            });
            liBox.append(liLabel);
            listBox.append(liBox);
          });
        
        });
      } catch (error) {
        log(error);
      }
      
      

      return listBox;
    }

    async doList () {
      let res = [];
      const settings = this.getSettings();
      const fpath = settings.get_string('quick-filepath');
      const append = settings.get_string('quick-append');
      const prepend = settings.get_string('quick-prepend');
      try {
        
        // [\s\S]*?(?<=^---$)
        const fileStr = await this.fopen(fpath);
        let list = fileStr.split(append);
        log('list: ', list);
        list.forEach(li => {
          res.push(li);
        });
        
      } catch (error) {
        log(error);
      }
      
      return res;
    }

    fopen (path) {
      return new Promise((resolve, reject) => {
        const file = Gio.File.new_for_path(path);
        // asynchronous file loading...
        file.load_contents_async(null, (file, res) => {
          try {
            // read the file into a variable...
            const contents = file.load_contents_finish(res)[1];
            const decoder = new TextDecoder('utf-8');
            const dataString = decoder.decode(contents);
    
            resolve(dataString);
          } catch (e) {
            log(e);
            
            reject(e);
          }
        });
      });
    }

  }
)
const qtapp = new QuickText();

try {
  qtapp.run([imports.system.programInvocationName]);
} catch (error) {
  log(error);
}

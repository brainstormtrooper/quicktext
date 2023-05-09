#!/usr/bin/gjs
'use strict';
const extPath = '.local/share/gnome-shell/extensions/quicktext@brainstormtrooper.github.io';
imports.gi.versions.Gtk = '4.0';
imports.searchPath.unshift(extPath);
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext;
const GioSSS = Gio.SettingsSchemaSource;
const { qWindow } = imports.interface;
const { vevent, vtodo } = imports.events;
const spl = Gio.SubprocessLauncher;



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
      this.openButton = window._openButton;
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
      const schemaSource = GioSSS.new_from_directory(`${extPath}/schemas`, null, true);
      const schema = schemaSource.lookup(schemaId, true);
      const schemaObj = { settings_schema: schema }

      return new Gio.Settings(schemaObj);
      // log(settings.get_string('quick-filepath'));
    }

    getListUI () {
      let items = [];
      const launcher = new spl();
      const listBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL
      });

      this.openButton.connect('clicked', () => {
        const settings = this.getSettings();

        launcher.spawnv(['xdg-open', settings.get_string('quick-filepath')]);
      });

      try {
        let P = this.doList();
        // items = await 
        P.then(items => {    
        
        
          items.forEach(item => {
            const frame = new Gtk.Frame({
              label:  null
            });
            const liBox = new Gtk.Box({
              orientation: Gtk.Orientation.VERTICAL
            });
            const liLabel = new Gtk.Label({
              label: item
            });
            const liBtns = new Gtk.Box({
              orientation: Gtk.Orientation.HORIZONTAL,
              halign: Gtk.Align.END
            });
            const liEventBtn = new Gtk.Button({
              label: 'New Event'
            });
            const liTaskBtn = new Gtk.Button({
              label: 'New Task'
            });
            liEventBtn.connect('clicked', () => {
              const eventstr = this.strRepl(vevent, item);

              const [tmpevent, ] = Gio.File.new_tmp('quick-XXXXXX.ics');
              const bytes = GLib.ByteArray.new_take(eventstr);
              // log(stream);
              // stream.write(bytes, null)
              tmpevent.replace_contents(bytes, null, false, null, null);
              launcher.spawnv(['xdg-open', tmpevent.get_path()]);
            });
            liTaskBtn.connect('clicked', () => {
              
              const todostr = this.strRepl(vtodo, item);

              const bytes = GLib.ByteArray.new_take(todostr);
              const props = {
                data: bytes,
                filename: 'task.ics'
              }
              this.fSave(props, (res) => {
                log(res);
              });
            });
            liBtns.append(liEventBtn);
            liBtns.append(liTaskBtn);
            liBox.append(liLabel);
            liBox.append(liBtns);
            frame.set_child(liBox);
            listBox.append(frame);

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
      // const prepend = settings.get_string('quick-prepend');
      try {
        
        // [\s\S]*?(?<=^---$)
        const fileStr = await this.fopen(fpath);
        let list = fileStr.split(append);
        
        list.forEach(li => {
          res.push(li);
        });
        
      } catch (error) {
        log(error);
      }
      
      return res;
    }

    calTimeNow () {
      const stamp = GLib.DateTime.new_now_utc();
      const nowStr = stamp.format('%Y%m%dT%H%M%SZ');
      
      return nowStr;
    }

    strRepl (tpl, note) {
      let myCal = tpl;
      
      const nowStr = this.calTimeNow();
      const id = this.makeid();

      const times = [/{{stamp}}/gm, /{{duedate}}/gm, /{{startdate}}/gm, /{{enddate}}/gm];

      times.forEach(slug => {
        myCal = myCal.replace(slug, nowStr);
      });
      myCal = myCal.replace(/{{uuid}}/gm, id);
      myCal = myCal.replace(/{{note}}/gm, note);
      
      return myCal;
    }

    makeid () {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      let counter = 0;
      while (counter < 6) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
      }

      return result;
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

    fSave(props, ret) {
      // const parent = props.parent ? props.parent : null;
      const title = props.title ? props.title : 'Save a file';
      const data = props.data;
      const filename = props.filename;
      const foldername = props.foldername;
    
    
      const saver = new Gtk.FileDialog({ title });
    
      if (filename) {
        saver.set_initial_name(filename);
      }
      if (foldername) {
        saver.set_initial_folder(Gio.File.new_for_path(foldername));
      }
      saver.save(null, null, async (o, r) => {
      
        try {
          const dest = await o.save_finish(r);
          dest.replace_contents(data, null, false,
            Gio.FileCreateFlags.REPLACE_DESTINATION, null);
          ret(dest.get_basename());
        } catch (e) {
          log(e)
          throw e;
        }
    
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

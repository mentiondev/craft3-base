# Craft 3 Starter Project

This is a forked project of the excellent [nystudio107 Craft 3 CMS scaffolding project](https://github.com/nystudio107/craft) with my own customisations


## Assumptions

Since this is boilerplate that mention uses for projects, it is by definition opinionated, and has a number of assumptions:

* Local setup is done via the command line
* Gulp is used as the frontend workflow automation tool
* NPM or YARN are setup
* Bootstrap 3 is used for the CSS framework
* Nginx is used as the web server
* MAMP Pro is used for the local database with Sequel Pro, so will need editing for other setups
* [nystudio107/craft-scripts](https://github.com/nystudio107/craft-scripts) are used for database/asset synching and backups
* [nystudio107/craft3-multi-environment](https://github.com/nystudio107/craft3-multi-environment) is used for the Craft 3 multi-environment setup

Obviously you're free to remove whatever components you don't need/want to use.


## Initial setup using mentiondev/craft3-base

This project package works exactly the way Pixel & Tonic's [craftcms/craft](https://github.com/craftcms/craft) package works; you create a new project by first creating & installing the project:

    composer create-project mentiondev/craft3-base PATH

Make sure that `PATH` is the path to your project, including the name you want for the project, e.g.:

    composer create-project mentiondev/craft3-base PATH

Next go to MAMP Pro and `create a new host` and point it to the `/web` folder in the project you created.

Also `create a new database` and note/copy the name as will be needed in the craft setup. Then click save to restart the local apache and mysql.

Then back in the terminal `cd` to your new project directory, and run Craft's `setup` console command to create your `.env` environments and optionally install:

    cd PATH
    ./craft setup

Next, run the `nys-setup` command to configure Craft-Scripts & Craft 3 Multi-Environment based on your newly created `.env` settings:

    ./nys-setup

If you ever delete the `vendor` folder or such, just re-run:

    ./nys-setup

...and it will re-create the symlink to your `.env.sh`

Next edit the `.env.gulp.json` file to point to local url you've chosen. This is required for browsersync to work.

Finally, in the terminal in the project root type

    gulp

And browsersync will start the browser, and it's ready to start using.


## Assets

Login to Craft CMS and got to `Settings/Assets` and create a `New volume` with the folder name of your choice

Then set the `Base URL` to

    @baseUrl/assets

And the `File System Path` to

    @basePath/assets

And then copy these to the `config/volumes.php` file


## Cache busting for live sites  

This is created using the method described in [Simple Static Asset Versioning in Craft CMS](https://nystudio107.com/blog/simple-static-asset-versioning)

I've included a twig tag called `{{ staticAssetsVersion }}` which references `craft.app.config.general.custom.staticAssetsVersion` in the `config/general.twig`

To use it add

    {% if env != 'local' %}.{{ staticAssetsVersion }}{% endif %}

before the filename. For example:

    <link href="{{ siteUrl }}css/main{% if env != 'local' %}.{{staticAssetsVersion}}{% endif %}.css" rel="stylesheet">

This will output `<link href="http://<siteurl>/css/main.1.css" rel="stylesheet">` on the live site so that it is cached for that version number and `<link href="https://<siteurl>/css/main.1546193063.css" rel="stylesheet">` on the staging site, as the staging site uses the `time()` tag for the Static Assets Version number, so that it is not cached on the development server while changes are regularly being made, as this changes every second.

To bust the cache on the live site, go to the terminal in the project root and type:

    gulp build

Which will increase the staticAssetsVersion number by 1

For `{{staticAssetsVersion}}` to work it the following needs to be added to the nginx config on the server at the top of the file

    location ~* (.+)\.(?:\d+)\.(js|css|png|jpg|jpeg|gif|webp)$ {
      try_files $uri $1.$2;
    }

and `restart` the server.

This will make the browser not see any num­bers before the sta­t­ic asset file­name exten­sion, and then force the browser to download a new version of the file if the number has been changed, hence, busting the cache.

Again, for a full explanation see [Simple Static Asset Versioning in Craft CMS](https://nystudio107.com/blog/simple-static-asset-versioning)


## Database/asset synching via craft-scripts

For full documentation on how to use all of `nystudio107/craft-scripts` go to: [nystudio107/craft-scripts](https://github.com/nystudio107/craft-scripts)

There are several scripts included in `craft-scripts`, each of which perform different functions. They all use a shared `.env.sh` to function. This `.env.sh` should be created on each environment where you wish to run the `craft-scripts`, and it should be excluded from your git repo via `.gitignore`.

### Setup
* Open up the `.env.sh` file into your favorite editor, and replace `REPLACE_ME` with the appropriate settings.

### pull_db.sh

To pull down a database dump from a remote server type

    ./pull_db.sh

The `pull_db.sh` script pulls down a database dump from a remote server, and then dumps it into your local database. It backs up your local database before doing the dump.

The db dumps that `craft-scripts` does will exclude tables that are temporary/cache tables that we don't want in our backups/restores, such as the `templatecaches` table.

See [Database & Asset Syncing Between Environments in Craft CMS](https://nystudio107.com/blog/database-asset-syncing-between-environments-in-craft-cms) for a detailed writeup.

**N.B.:** The `pull_db.sh` script can be used even if the local and remote are on the same server.

### pull_assets.sh

To pull down asset directories from a remote server type

    ./pull_assets.sh

The `pull_assets.sh` script pulls down an arbitrary number of asset directories from a remote server, since we keep client-uploadable assets out of the git repo. The directories it will pull down are specified in `LOCAL_ASSETS_DIRS`

It will also pull down the Craft `userphotos` and `rebrand` directories from `craft/storage` by default. The directories it will pull down are specified in `LOCAL_CRAFT_FILE_DIRS`

See [Database & Asset Syncing Between Environments in Craft CMS](https://nystudio107.com/blog/database-asset-syncing-between-environments-in-craft-cms) for a detailed writeup.

**N.B.:** The `pull_assets.sh` script can be used even if the local and remote are on the same server.

### pull_backups.sh

To pull down script pulls down the backups created by `craft-scripts` from a remote server type

    ./pull_backups.sh

The `pull_backups.sh` script pulls down the backups created by `craft-scripts` from a remote server, and synced into the `LOCAL_BACKUPS_PATH`

For database backups, a sub-directory `REMOTE_DB_NAME/db` inside the `REMOTE_BACKUPS_PATH` directory is used for the database backups.

For asset backups, a sub-directory `REMOTE_DB_NAME/assets` inside the `REMOTE_BACKUPS_PATH` directory is used for the asset backups.

Because `rsync` is used for these backups, you can put a `.rsync-filter` in any directory to define files/folders to ignore. [More info](http://serverfault.com/questions/414358/rsync-filter-file-rules-for-subpath)

See [Mitigating Disaster via Website Backups](https://nystudio107.com/blog/mitigating-disaster-via-website-backups) for a detailed writeup.

For more information on how to use them and the other options it has go to [nystudio107/craft-scripts](https://github.com/nystudio107/craft-scripts)

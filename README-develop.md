N|Solid Cloud Foundry Buildpack - development info
================================================================================

Because the buildpack is typically referenced via a URL to the git repo, every
commit to this repo, that isn't just documentation, should use a new version.
That means:

* increment the `VERSION` file
* add a git tag, with a `v` prefix, eg `v1.0.0`

Additionally:

* every release should test using all LTS releases; eg, argon, boron, carbon, etc

* VERSION.cf-nodejs-buildpack is the version of the Node.js buildpack this
  was based on; when updating content based on Cloud Foundry Node.js
  buildpack changes, update this file.


Cutting a new release
================================================================================

Updates needed for every release - in theory, only source changes required:

* update the `VERSION` file to the version number of the buildpack
* update the `VERSION.nsolid` file to the version number of N|Solid
* update the `CHANGELOG.md` file

To rebuild/test the buildpacks in context of those changes:

* run `lib/vendor/nsolid/tools/build-buildpack-zip.sh` to build the buildpack
  archives
* run `test/test-apps-run.sh` to run tests against those buildpacks
  * note the tests run against a local, default install of [PCFdev][]
* run `test/test-apps-verify.js` to verify the results of those tests, if
  you'd like to run the verification bits again, this is run at the end
  of `test/test-apps-run.sh` as well.

Note that as of late 2018, the first test ALWAYS fails.  Some kind of race
condition regarding getting the buildpack installed, and having it available.
If the tests fail, and only fail for one test, and it's the first test, run
them again, and they should pass.

[PCFdev]: https://github.com/pivotal-cf/pcfdev

When everything's ready to go:

* merge to master
* tag commit with version number
* upload bundled and unbundled zipped buildpacks to [GH release page][]

Next step is to update the [N|Solid Console demo code][] to use the new release
of N|Solid Console.  You're done with the `cf dev` environment at this point,
so you can stop it via `cf dev stop`, and get a few GB of RAM back.

[GH release page]: https://github.com/nodesource/nsolid-buildpack-cf-v3/releases
[N|Solid Console demo code]: https://github.com/nodesource/nsolid-cf-v3

Pre-reqs for cutting a new release
================================================================================

#### standard

Sorry, but currently `standard` will have to be globally installed to run
the build scripts.  This should be fixed - your first homework assignment!

    npm install -g standard

#### cf dev

The tests for the buildpack are run on a local `cf dev` environment, which
is a way of running a Cloud Foundry instance on your local box.  More information
here: https://github.com/cloudfoundry-incubator/cfdev

Note that `cf dev` ends up taking > 40 minutes to launch, so fire it up before
you're going to do a build, and you'll have time for a adult beverages before it
finishes.

#### ruby bits for buildpack bundling

The buildpack bundle tool is written in Ruby (it's from Pivotal), and so of
course requires lots of odd set up.  From memory, you can just try to run it
and it will complain about packages you don't have, and then install them via
gem or whatever.  I use `rbenv` to manage this nonsense, and have the following
in my `~/.bash_profile`, which I think is fairly standard `rbenv` stuff:

```
export PATH="/Users/pmuellr/.rbenv/shims:${PATH}"
export RBENV_SHELL=bash
source '/usr/local/Cellar/rbenv/1.0.0/libexec/../completions/rbenv.bash'
command rbenv rehash 2>/dev/null
rbenv() {
  local command
  command="$1"
  if [ "$#" -gt 0 ]; then
    shift
  fi

  case "$command" in
  rehash|shell)
    eval "$(rbenv "sh-$command" "$@")";;
  *)
    command rbenv "$command" "$@";;
  esac
}
```

Here's the output of `gem list` for me:

```
$ gem list

*** LOCAL GEMS ***

activesupport (4.1.16)
aws-sdk-core (2.2.0)
aws-sdk-resources (2.2.0)
bigdecimal (1.2.8)
bundler (1.13.1)
cf-uaa-lib (3.2.5)
childprocess (0.5.9)
coderay (1.1.1)
did_you_mean (1.0.0)
diff-lcs (1.2.5)
ffi (1.9.14)
highline (1.6.21)
httparty (0.14.0)
httpclient (2.7.1)
i18n (0.7.0)
io-console (0.4.5)
jmespath (1.3.1)
json (1.8.3)
json_pure (1.8.3)
kwalify (0.7.2)
little-plugger (1.1.4)
logging (1.8.2)
method_source (0.8.2)
minitar (0.5.4)
minitest (5.9.0, 5.8.3)
multi_json (1.12.1)
multi_xml (0.5.5)
net-scp (1.1.2)
net-ssh (2.9.2)
net-ssh-gateway (1.2.0)
net-telnet (0.1.1)
netaddr (1.5.1)
power_assert (0.2.6)
progressbar (0.9.2)
pry (0.10.4)
psych (2.0.17)
rake (10.4.2)
rdoc (4.2.1)
rspec (3.5.0)
rspec-core (3.5.1)
rspec-expectations (3.5.0)
rspec-instafail (1.0.0)
rspec-mocks (3.5.0)
rspec-support (3.5.0)
semi_semantic (1.2.0)
slop (3.6.0)
sshkey (1.7.0)
terminal-table (1.4.5)
test-unit (3.1.5)
thread_safe (0.3.5)
tzinfo (1.2.2)
```


Differences from the Cloud Foundry Buildpack for Node.js
================================================================================

The Cloud Foundry Buildpack for Node.js is avaliable here:

<https://github.com/cloudfoundry/nodejs-buildpack>

The differences between the N|Solid buildpack and the Node.js buildpack, as of
version 1.5.22, are:

- added nsolid entry to `.gitignore`
- replaced the `CHANGELOG.md`
- added `CODE_OF_CONDUCT.md`
- removed `CONTRIBUTING.md` (some content now in `README.md`)
- removed `ISSUE_TEMPLATE`
- renamed `LICENSE` to `LICENSE.md`, embeds Node.js buildpack license, N|Solid is at top
- modified `manifest.yml` to only include Node.js versions corresponding to the N|Solid releases
- removed `PULL_REQUEST_TEMPLATE`
- copied original `README.md` to `README-cf-nodejs-buildpack.md`
- added new `README.md`
- renamed original `VERSION` to `VERSION.cf-nodejs-buildpack`
- changed `VERSION` to restart at `1.0.0`
- one line modification to `bin/compile`, to add nsolid bits
- one line mod to `lib/binaries.sh`, to add nsolid bits
- everything in `lib/vendor/nsolid` is new

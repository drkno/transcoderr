--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE JobStates (
    id          INTEGER PRIMARY KEY,
    state       TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    final       INTEGER NOT NULL,
    failure     INTEGER NOT NULL,

    CONSTRAINT jobStates_ck_final CHECK (final IN (0, 1)),
    CONSTRAINT jobStates_ck_failure CHECK (failure IN (0, 1))
);

CREATE TABLE Jobs (
    id          INTEGER PRIMARY KEY,
    state       TEXT    NOT NULL,
    file        TEXT    NOT NULL,
    lastRun     TEXT,
    lastSuccess TEXT,
    lastFailure TEXT,
    runCount    INTEGER NOT NULL,

    CONSTRAINT jobs_fk_state FOREIGN KEY (state)
        REFERENCES JobStates(state)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE PluginLoaders (
    id      INTEGER PRIMARY KEY,
    name    TEXT UNIQUE
);

CREATE TABLE Plugins (
    id          INTEGER PRIMARY KEY,
    loader      TEXT    NOT NULL,
    path        TEXT    NOT NULL UNIQUE,
    enabled     INTEGER NOT NULL DEFAULT 1,
    failureSafe INTEGER NOT NULL DEFAULT 0,

    name        TEXT    NOT NULL,
    description TEXT,
    version     TEXT    NOT NULL,

    CONSTRAINT plugins_ck_enabled CHECK (enabled IN (0, 1)),
    CONSTRAINT plugins_ck_failureSafe CHECK (failureSafe IN (0, 1)),
    CONSTRAINT plugins_fk_state FOREIGN KEY (loader)
        REFERENCES PluginLoaders(name)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE PluginTypes (
    id          INTEGER PRIMARY KEY,
    type        TEXT    UNIQUE,
    description TEXT    NOT NULL
);

CREATE TABLE PluginType (
    id          INTEGER PRIMARY KEY,
    pluginId    INTEGER NOT NULL,
    type        TEXT    NOT NULL,

    CONSTRAINT plugintype_fk_pluginId FOREIGN KEY (pluginId)
        REFERENCES Plugins(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT plugintype_fk_type FOREIGN KEY (type)
        REFERENCES PluginTypes(type)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT plugintype_ck_uniq UNIQUE (pluginId, type)
);

CREATE TABLE ExecutionStates (
    id          INTEGER PRIMARY KEY,
    state       TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL
);

CREATE TABLE JobExecutions (
    id          INTEGER PRIMARY KEY,
    jobId       INTEGER NOT NULL,
    pluginId    INTEGER NOT NULL,
    jobState    TEXT    NOT NULL,
    state       TEXT    NOT NULL,
    context     TEXT,

    CONSTRAINT jobexecutions_ck_unique UNIQUE (jobId, pluginId),
    CONSTRAINT jobexecutions_fk_jobId FOREIGN KEY (jobId)
        REFERENCES Jobs(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT jobexecutions_fk_pluginId FOREIGN KEY (pluginId)
        REFERENCES Plugins(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT jobexecutions_fk_jobState FOREIGN KEY (jobState)
        REFERENCES JobStates(state)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT jobexecutions_fk_state FOREIGN KEY (state)
        REFERENCES ExecutionStates(state)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE Preferences (
    id          INTEGER PRIMARY KEY,
    key         TEXT    NOT NULL UNIQUE,
    value       TEXT
);

INSERT INTO JobStates (state, name, description, final, failure) VALUES ('new', 'New', 'This is a new job that has never been executed before.', 1, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('renew', 'Renew', 'This is a previously run job that should be re-executed.', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('meta', 'Gathering metadata', 'Performing analysis on the files.', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('pre', 'Generating transcoder options', 'Generating options to use with the transcoder, if any for each file', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('filter', 'Filtering options and files', 'Checking that generated options are optimal and removing deletable files.', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('exec', 'Running transcode operations', 'Using ffmpeg to ensure files are in the desired format.', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('post', 'Post-execution analysis', 'Analysing changes that were made and notifying downstream services.', 0, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('complete', 'Complete', 'The job is complete.', 1, 0);
INSERT INTO JobStates (state, name, description, final, failure) VALUES ('abort', 'Aborted', 'The job was aborted.', 1, 1);

INSERT INTO ExecutionStates (state, name, description) VALUES ('started', 'Plugin Started', 'The plugin has started executing');
INSERT INTO ExecutionStates (state, name, description) VALUES ('successful', 'Successful', 'Plugin execution was successful');
INSERT INTO ExecutionStates (state, name, description) VALUES ('failed', 'Failed', 'Plugin execution failed');
INSERT INTO ExecutionStates (state, name, description) VALUES ('unknown', 'Unknown', 'The plugin is in an unknown state');

INSERT INTO PluginLoaders (name) VALUES ("file");
INSERT INTO PluginLoaders (name) VALUES ("package");

INSERT INTO PluginTypes (type, description) VALUES ('meta', 'Performs analysis on the files.');
INSERT INTO PluginTypes (type, description) VALUES ('pre', 'Generates transcoder options');
INSERT INTO PluginTypes (type, description) VALUES ('filter', 'Filters options and files');
INSERT INTO PluginTypes (type, description) VALUES ('exec', 'Runs transcode operations');
INSERT INTO PluginTypes (type, description) VALUES ('post', 'Performs post-execution analysis');

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE JobExecutions;
DROP TABLE ExecutionStates;
DROP TABLE Jobs;
DROP TABLE JobStates;
DROP TABLE PluginType;
DROP TABLE PluginTypes;
DROP TABLE Plugins;
DROP TABLE PluginLoaders;
DROP TABLE Preferences;

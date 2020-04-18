--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE States (
    id          INTEGER PRIMARY KEY,
    state       TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL
);

CREATE TABLE Job (
    id          INTEGER PRIMARY KEY,
    state       TEXT    NOT NULL,
    file        TEXT    NOT NULL,
    lastRun     TEXT,
    lastSuccess TEXT,
    lastFailure TEXT,
    runCount    INTEGER NOT NULL,

    CONSTRAINT job_fk_state FOREIGN KEY (state)
        REFERENCES States(state)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE Plugin (
    id          INTEGER PRIMARY KEY,
    name        TEXT    NOT NULL,
    enabled     INTEGER NOT NULL DEFAULT 1,
    checksum    TEXT,

    CONSTRAINT plugin_ck_enabled CHECK (enabled IN (0, 1))
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
    jobState    TEXT    NOT NULL
    state       TEXT    NOT NULL,
    context     TEXT,

    CONSTRAINT jobexecutions_ck_unique UNIQUE (jobId, pluginId)
    CONSTRAINT jobexecutions_fk_jobId FOREIGN KEY (jobId)
        REFERENCES Job(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT jobexecutions_fk_pluginId FOREIGN KEY (pluginId)
        REFERENCES Plugin(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT jobexecutions_fk_jobState FOREIGN KEY (jobState)
        REFERENCES States(state)
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

INSERT INTO States (state, name, description) VALUES ('new', 'New', 'This is a new job that has never been executed before.');
INSERT INTO States (state, name, description) VALUES ('meta', 'Gathering metadata', 'Performing analysis on the files.');
INSERT INTO States (state, name, description) VALUES ('pre', 'Generating transcoder options', 'Generating options to use with the transcoder, if any for each file');
INSERT INTO States (state, name, description) VALUES ('filter', 'Filtering options and files', 'Checking that generated options are optimal and removing deletable files.');
INSERT INTO States (state, name, description) VALUES ('exec', 'Running transcode operations', 'Using ffmpeg to ensure files are in the desired format.');
INSERT INTO States (state, name, description) VALUES ('post', 'Post-execution analysis', 'Analysing changes that were made and notifying downstream services.');
INSERT INTO States (state, name, description) VALUES ('complete', 'Complete', 'The job is complete.');
INSERT INTO States (state, name, description) VALUES ('abort', 'Aborted', 'The job was aborted.');

INSERT INTO ExecutionStates (state, name, description) VALUES ('started', 'Plugin Started', 'The plugin has started executing');
INSERT INTO ExecutionStates (state, name, description) VALUES ('successful', 'Successful', 'Plugin execution was successful');
INSERT INTO ExecutionStates (state, name, description) VALUES ('failed', 'Failed', 'Plugin execution failed');
INSERT INTO ExecutionStates (state, name, description) VALUES ('unknown', 'Unknown', 'The plugin is in an unknown state');

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE JobExecutions;
DROP TABLE Job;
DROP TABLE States;
DROP TABLE Plugin;
DROP TABLE Preferences;

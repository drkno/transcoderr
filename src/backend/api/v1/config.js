const { Router } = require('express');

module.exports = serviceFactory => {
    const configRouter = Router();
    const preferencesService = serviceFactory.getPreferencesService();

    configRouter.get('/', async(_, res) => {
        // todo, this should probably be paged
        const configItems = await preferencesService.getAll();
        res.json(configItems);
    });

    configRouter.post('/:id', async(req, res) => {
        const configKey = req.params.id;
        try {
            await preferencesService.setPreferenceForId(configKey, req.body.value);
            res.json({
                success: true
            });
        }
        catch (e) {
            res.status(400).json({
                success: false,
                error: e.message
            });
        }
    });

    configRouter.delete('/:id', async(req, res) => {
        const configKey = req.params.id;
        try {
            await preferencesService.deletePreference(configKey);
            res.json({
                success: true
            });
        }
        catch (e) {
            res.status(400).json({
                success: false,
                error: e.message
            });
        }
    });

    return configRouter;
};

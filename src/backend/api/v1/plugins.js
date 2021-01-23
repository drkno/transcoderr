const { Router } = require('express');

module.exports = serviceFactory => {
    const pluginRouter = Router();
    const pluginService = serviceFactory.getPluginService();

    pluginRouter.get('/', async(_, res) => {
        // todo, this should probably be paged
        const allPlugins = await pluginService.getAllKnownPlugins();
        res.json(allPlugins);
    });

    pluginRouter.post('/disable/:id', async(req, res) => {
        const pluginId = req.params.id;
        try {
            pluginService.disablePlugin(pluginId);
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

    pluginRouter.post('/enable/:id', async(req, res) => {
        const pluginId = req.params.id;
        try {
            pluginService.enablePlugin(pluginId);
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

    pluginRouter.delete('/remove/:id', async(req, res) => {
        const pluginId = req.params.id;
        try {
            pluginService.deletePlugin(pluginId);
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

    return pluginRouter;
};

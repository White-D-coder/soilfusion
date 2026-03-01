from ml_pipeline import SoilFusionMLPipeline
pipeline = SoilFusionMLPipeline()
pipeline.load_data()
pipeline.preprocess_data()
pipeline.train_yield_prediction()

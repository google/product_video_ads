import google.cloud.logging
client = google.cloud.logging.Client()
client.setup_logging()

from generate_product_configs import generate_product_configs
from generate_video_configs import generate_video_configs
from generate_ads_targeting import generate_ads_targeting
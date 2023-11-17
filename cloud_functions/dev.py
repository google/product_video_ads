import os
import yaml

def main(): 
    with open("env.yaml") as env:
        data = yaml.load(env, Loader=yaml.FullLoader)
        for key, value in data.items():
            os.environ[key] = value 

    from generate_product_configs import generate_product_configs
    generate_product_configs(None)

    # from generate_video_configs import generate_video_configs
    # generate_video_configs(None)

    # from generate_video_targeting import generate_video_targeting
    # generate_video_targeting(None)


if __name__ == "__main__":
    main()

import pandas as pd, numpy as np, json, re, geopandas as gpd
from collections import defaultdict
OUT='/tmp/claude-0/work/app_data/out'; import os; os.makedirs(OUT,exist_ok=True)
m=pd.read_csv('/mnt/project-files/notebook/v4/data/master_panel_v4.csv',dtype={'kode_bps':str})
sd=pd.read_csv('/mnt/project-files/notebook/v4/data/subdas_hulu_hilir.csv')
k2=pd.read_csv('/mnt/project-files/data/gee_bagian3/gee3_K2_kab_x_subdas.csv',dtype={'kode_bps':str})
pr=pd.read_csv('/tmp/claude-0/work/nb5/hasil_prioritas_kabkota.csv',dtype={'kode_bps':str})
TH=13
m['y']=((m.korban_jiwa>=1)|(m.rr_berat>=TH)).astype(int)
freq=m[m.tahun<=2024].groupby('kode_bps').y.mean()
e=m[m.tahun==2025].set_index('kode_bps')
def short(n): return re.sub(r'^(Kabupaten|Kota) ','',n)
# --- hulu: kontribusi kab hulu
hist={}
for _,r in k2.iterrows():
    d={}
    for part in str(r.histogram).strip('{}').split(','):
        if '=' in part: a,b=part.split('='); d[int(float(a))]=float(b)
    hist[r.kode_bps]=d
sub=sd.set_index('idx'); id2idx=dict(zip(sd.HYBAS_ID,sd.idx))
up=defaultdict(list)
for _,r in sd.iterrows():
    if r.NEXT_DOWN in id2idx: up[id2idx[r.NEXT_DOWN]].append(r.idx)
def upstream(i):
    s=[];st=[i]
    while st:
        j=st.pop(); s.append(j); st+=up[j]
    return s
sub_kab=defaultdict(dict)
for k,d in hist.items():
    for i,c in d.items(): sub_kab[i][k]=c
loss_km2=(sd.set_index('idx').loss_curam_1525*sd.set_index('idx').SUB_AREA)
hulu={}
for k,d in hist.items():
    own=set(d); U=set()
    for i in own: U|=set(upstream(i))
    contrib=defaultdict(float)
    for i in U:
        tot=sum(sub_kab[i].values()) or 1
        for kk,c in sub_kab[i].items(): contrib[kk]+=loss_km2.get(i,0)*c/tot
    lst=sorted(((kk,round(v,2)) for kk,v in contrib.items() if v>0.05),key=lambda x:-x[1])
    hulu[k]={'lokal':round(contrib.get(k,0),2),'hulu':[[kk,v] for kk,v in lst if kk!=k][:8],
             'n_subdas':len(own),'n_subdas_hulu':len(U)}
# --- TOPSIS stabilitas (sama dengan notebook)
cfg=[('bahaya','benefit'),('loss_curam_hulu_frak','benefit'),('penduduk','benefit'),('p0','benefit'),('ipm','cost'),('rs_per100k','cost'),('puskesmas_per100k','cost'),('jalan_km_per_km2','cost')]
d25=e.join(pr.set_index('kode_bps')[['bahaya']]).dropna(subset=['bahaya'])
def topsis(df,w):
    M=np.column_stack([df[c].values.astype(float) for c,_ in cfg]); M=(M-M.mean(0))/M.std(0); W=np.array(w)/np.sum(w)
    V=M*W; ben=np.array([t=='benefit' for _,t in cfg]); ideal=np.where(ben,V.max(0),V.min(0)); anti=np.where(ben,V.min(0),V.max(0))
    dp=np.sqrt(((V-ideal)**2).sum(1)); dm=np.sqrt(((V-anti)**2).sum(1)); return dm/(dp+dm)
base=topsis(d25,[3,1,2,1,1,1,1,1])
chk=pd.Series(base,index=d25.index); assert np.allclose(chk.loc[pr.kode_bps].values,pr.prioritas.values,atol=1e-9)
rng=np.random.default_rng(1); R=[]
for _ in range(1000):
    w=rng.dirichlet(np.ones(8)); R.append(pd.Series(topsis(d25,w)).rank(ascending=False).values)
R=np.array(R); stab=pd.DataFrame({'med':np.median(R,0),'p5':np.percentile(R,5,0),'p95':np.percentile(R,95,0)},index=d25.index)
# --- kab records
gdf=gpd.read_file('/mnt/project-files/data/sumatera_kabkota_154_v2.gpkg')
kc=[c for c in gdf.columns if 'kode' in c.lower()][0]
gdf[kc]=gdf[kc].astype(str)
rows=[]
for k,r in e.iterrows():
    p=pr.set_index('kode_bps').loc[k]
    rows.append(dict(kode=k,nama=short(r.nama),jenis='Kota' if r.nama.startswith('Kota') else 'Kabupaten',prov=r.provinsi,
      lon=round(r.centroid_lon,4),lat=round(r.centroid_lat,4),
      korban25=int(r.korban_jiwa),terdampak25=int(r.terdampak),rrb25=int(r.rr_berat),infra25=int(r.sekolah_rusak+r.faskes_rusak+r.jembatan_rusak),
      sekolah25=int(r.sekolah_rusak),faskes25=int(r.faskes_rusak),jembatan25=int(r.jembatan_rusak),
      freq=round(float(freq.get(k,np.nan)),3),
      A_med=round(r.A_rusle_median_tha,3),C=round(r.C_rusle,4),LS=round(r.LS_rusle,3),K=round(r.K_rusle,4),R=round(r.R_rusle,0),
      hulu_frak=round(r.loss_curam_hulu_frak,5),hulu_km2=round(r.loss_curam_hulu_km2,1),
      hutan_curam2000=round(r.frak_hutan_curam_2000,3),slope=round(r.slope_deg,2),tree=round(r.lc_10,3),
      imerg=None if pd.isna(r.ev_imerg_total_mm) else round(r.ev_imerg_total_mm),chirps_ev=None if pd.isna(r.ev_chirps_total_mm) else round(r.ev_chirps_total_mm),
      imerg_maks=None if pd.isna(r.ev_imerg_intensitas_maks_mmjam) else round(r.ev_imerg_intensitas_maks_mmjam,1),
      genangan=None if pd.isna(r.genangan_km2) else round(r.genangan_km2,1),
      hujan25=round(r.hujan_mm),
      bahaya=round(float(p.bahaya),4),penduduk=int(r.penduduk),p0=round(r.p0,2),ipm=round(r.ipm,2),rs=round(r.rs_per100k,3),pusk=round(r.puskesmas_per100k,3),jalan=round(r.jalan_km_per_km2,4),
      prior=round(float(p.prioritas),4),rank=int(p.peringkat),rmed=float(stab.loc[k,'med']),rp5=float(stab.loc[k,'p5']),rp95=float(stab.loc[k,'p95']),
      **hulu.get(k,{'lokal':0,'hulu':[],'n_subdas':0,'n_subdas_hulu':0})))
json.dump(rows,open(f'{OUT}/kab.json','w'),ensure_ascii=False,separators=(',',':'))
ann=m.groupby('tahun')[['kejadian','korban_jiwa','terdampak','rr_berat','sekolah_rusak','faskes_rusak','jembatan_rusak']].sum().reset_index()
json.dump(ann.astype(int).to_dict('records'),open(f'{OUT}/tahunan.json','w'),separators=(',',':'))
# geometry
g=gdf[[kc,'geometry']].rename(columns={kc:'kode'}).to_crs(4326)
g['geometry']=g.geometry.simplify(0.004,preserve_topology=True)
g.to_file(f'{OUT}/kab.geojson',driver='GeoJSON',COORDINATE_PRECISION=4)
print(len(rows),os.path.getsize(f'{OUT}/kab.geojson'),os.path.getsize(f'{OUT}/kab.json'))
print(sorted(rows,key=lambda x:-x['hulu_frak'])[0]['nama'], [ (r['nama'],r['hulu'][:3]) for r in rows if r['nama'] in ('Aceh Tamiang','Aceh Utara','Langkat')])

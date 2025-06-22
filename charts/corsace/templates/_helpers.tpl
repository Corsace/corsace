{{/*
Expand the name of the chart.
*/}}
{{- define "corsace.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "corsace.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "corsace.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "corsace.labels" -}}
helm.sh/chart: {{ include "corsace.chart" . }}
{{ include "corsace.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "corsace.selectorLabels" -}}
app.kubernetes.io/name: {{ include "corsace.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "corsace.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "corsace.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Shared environment by deployments
*/}}
{{- define "corsace.env" -}}
- name: DEPLOYMENT
  value: production
- name: DB_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: databaseHost
- name: DISCORD_TOKEN
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: discordToken
- name: DISCORD_CLIENTSECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: discordClientSecret
- name: OSU_PROXY_BASEURL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuProxyBaseUrl
- name: OSU_V1_APIKEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuv1ApiKey
- name: OSU_V2_CLIENTID
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuv2ClientId
- name: OSU_V2_CLIENTSECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuv2ClientSecret
- name: OSU_BANCHO_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuBanchoUsername
- name: OSU_BANCHO_IRC_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuBanchoIRCPassword
- name: OSU_BANCHO_BOT_ACCOUNT
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: osuBanchoBotAccount
- name: KOA_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: koaKey
- name: INTEROP_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: interOpPassword
- name: GITHUB_WEBHOOK_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: githubWebhookSecret
- name: GITHUB_WEBHOOK_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: githubWebhookUrl
- name: BN_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: bnUsername
- name: BN_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: bnSecret
- name: CLOUDFLARE_R2_HOSTNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: cloudflareR2Hostname
- name: CLOUDFLARE_R2_ACCESS_KEY_ID
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: cloudflareR2AccessKeyId
- name: CLOUDFLARE_R2_SECRET_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: cloudflareR2SecretAccessKey
- name: CENTRIFUGO_API_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: centrifugoApiUrl
- name: CENTRIFUGO_PUBLIC_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: centrifugoPublicUrl
- name: CENTRIFUGO_API_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace.fullname" $ }}
      key: centrifugoApiKey
- name: API_PUBLICURL
  value: {{ default (lower (printf "%s%s%s%s" "http://" (include "corsace.fullname" $) "-api"  (ternary "" (printf ".%s.svc.%s." $.Release.Namespace $.Values.clusterDomain) (not $.Values.clusterDomain)))) $.Values.webServices.api.publicUrl }}
- name: CRONRUNNER_PUBLICURL
  value: {{ default (lower (printf "%s%s%s%s" "http://" (include "corsace.fullname" $) "-cronRunner" (ternary "" (printf ".%s.svc.%s." $.Release.Namespace $.Values.clusterDomain) (not $.Values.clusterDomain)))) $.Values.webServices.cronRunner.publicUrl }}
- name: BANCHOBOT_PUBLICURL
  value: {{ default (lower (printf "%s%s%s%s" "http://" (include "corsace.fullname" $) "-banchoBot" (ternary "" (printf ".%s.svc.%s." $.Release.Namespace $.Values.clusterDomain) (not $.Values.clusterDomain)))) $.Values.webServices.banchoBot.publicUrl }}
{{- range $webServiceName, $webService := $.Values.webServices }}
{{- if and (ne $webServiceName "api") (ne $webServiceName "cronRunner") (ne $webServiceName "banchoBot") }}
- name: {{ $webServiceName | upper }}_PUBLICURL
  value: {{ $webService.publicUrl }}
- name: {{ $webServiceName | upper }}_SSR
  value: "{{ $webService.ssr }}"
{{- end }}
{{- end }}
{{- end }}
